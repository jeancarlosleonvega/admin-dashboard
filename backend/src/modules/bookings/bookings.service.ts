import { bookingsRepository } from './bookings.repository.js';
import { prisma } from '../../infrastructure/database/client.js';
import { NotFoundError } from '../../shared/errors/NotFoundError.js';
import { ValidationError } from '../../shared/errors/ValidationError.js';
import { AuthorizationError } from '../../shared/errors/AuthorizationError.js';
import type { CreateBookingInput, BookingFiltersInput, MyBookingFiltersInput } from './bookings.schema.js';

type PaymentStatus = 'PENDING_PROOF' | 'PENDING_VALIDATION' | 'APPROVED' | 'REJECTED' | 'REFUNDED' | 'PENDING_CASH';

function formatMonthYear(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${y}-${m}`;
}

export class BookingsService {
  async findMy(userId: string, filters: MyBookingFiltersInput) {
    const { page, limit, status } = filters;
    const { items, total } = await bookingsRepository.findMy(userId, { status, page, limit });
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findAll(filters: BookingFiltersInput) {
    const { page, limit, ...rest } = filters;
    const { items, total } = await bookingsRepository.findAll({ ...rest, page, limit });
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    const item = await bookingsRepository.findById(id);
    if (!item) throw new NotFoundError('Reserva');
    return item;
  }

  async create(userId: string, data: CreateBookingInput) {
    // 1. Verificar usuario activo
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('Usuario');
    if (user.status !== 'ACTIVE') throw new ValidationError('Cuenta suspendida o inactiva');

    // 2. Verificar slot disponible
    const slot = await prisma.slot.findUnique({
      where: { id: data.slotId },
      include: {
        venue: {
          include: { sportType: true },
        },
      },
    });
    if (!slot) throw new NotFoundError('Slot');
    if (slot.status !== 'AVAILABLE') throw new ValidationError('Slot no disponible');

    // Get effective maxPlayers: schedule > venue > sportType
    const schedule = slot.scheduleId ? await prisma.venueSchedule.findUnique({ where: { id: slot.scheduleId }, select: { playersPerSlot: true } }) : null;
    const maxPlayers = schedule?.playersPerSlot ?? slot.venue.playersPerSlot ?? slot.venue.sportType.defaultPlayersPerSlot;

    if (data.numPlayers > maxPlayers) {
      throw new ValidationError(`El máximo de jugadores por turno es ${maxPlayers}`);
    }

    // 3. Verificar membresía y calcular precio
    let activeMembership: any = null;
    let precio: number;
    let isMemberPrice: boolean;
    let membershipPlanId: string | null = null;
    const mesActual = formatMonthYear(new Date());

    activeMembership = await prisma.userMembership.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        OR: [
          { endDate: null },
          { endDate: { gt: new Date() } },
        ],
      },
      include: { membershipPlan: true },
    });

    if (activeMembership) {
      const plan = activeMembership.membershipPlan;

      // Resetear contador mensual si cambió el mes
      if (activeMembership.currentMonthYear !== mesActual) {
        await prisma.userMembership.update({
          where: { id: activeMembership.id },
          data: { reservationsUsedMonth: 0, currentMonthYear: mesActual },
        });
        activeMembership.reservationsUsedMonth = 0;
      }

      // Verificar límite mensual
      if (plan.monthlyReservationLimit !== null) {
        if (activeMembership.reservationsUsedMonth >= plan.monthlyReservationLimit) {
          throw new ValidationError(
            `Límite mensual de reservas alcanzado (${activeMembership.reservationsUsedMonth}/${plan.monthlyReservationLimit})`
          );
        }
      }

      // Precio fijo desde SystemConfig
      const configPrecio = await prisma.systemConfig.findUnique({
        where: { key: 'golf_member_tee_time_price' },
      });
      precio = parseFloat(configPrecio?.value ?? '3000');
      isMemberPrice = true;
      membershipPlanId = activeMembership.membershipPlanId;
    } else {
      precio = parseFloat(slot.venue.sportType.defaultNonMemberPrice.toString());
      isMemberPrice = false;
      membershipPlanId = null;
    }

    // 4. Calcular servicios adicionales
    let services: any[] = [];
    let servicesTotalPrice = 0;

    if (data.serviceIds && data.serviceIds.length > 0) {
      services = await prisma.additionalService.findMany({
        where: { id: { in: data.serviceIds }, active: true },
      });
      if (services.length !== data.serviceIds.length) {
        throw new ValidationError('Uno o más servicios no encontrados o inactivos');
      }
      servicesTotalPrice = services.reduce((sum, s) => sum + parseFloat(s.price.toString()), 0);
    }

    const totalPrice = precio + servicesTotalPrice;

    // 6. Crear booking en transacción
    const booking = await prisma.$transaction(async (tx) => {
      // 1. Marcar slot como BOOKED
      await tx.slot.update({
        where: { id: data.slotId },
        data: { status: 'BOOKED' },
      });

      // 2. Generar QR code (solo si MP - se confirma inmediatamente)
      const qrCode = data.paymentMethod === 'MERCADOPAGO' ? crypto.randomUUID() : null;

      // 3. Crear booking
      const newBooking = await tx.booking.create({
        data: {
          userId,
          slotId: data.slotId,
          membershipPlanId,
          status: data.paymentMethod === 'MERCADOPAGO' ? 'CONFIRMED' : 'PENDING_PAYMENT',
          price: totalPrice,
          isMemberPrice,
          qrCode,
          notes: data.notes,
          numPlayers: data.numPlayers,
        },
        include: {
          slot: { include: { venue: { include: { sportType: true } } } },
        },
      });

      // 4. Crear booking services
      if (services.length > 0) {
        await tx.bookingService.createMany({
          data: services.map((s: any) => ({
            bookingId: newBooking.id,
            serviceId: s.id,
            price: s.price,
          })),
        });
      }

      // 5. Crear payment
      let paymentStatus: PaymentStatus;
      let expiresAt: Date | null = null;

      if (data.paymentMethod === 'MERCADOPAGO') {
        paymentStatus = 'APPROVED';
      } else if (data.paymentMethod === 'TRANSFER') {
        paymentStatus = 'PENDING_PROOF';
        const deadlineConfig = await tx.systemConfig.findUnique({
          where: { key: 'transfer_payment_deadline_hours' },
        });
        const hours = parseInt(deadlineConfig?.value ?? '24');
        expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
      } else {
        paymentStatus = 'PENDING_CASH';
      }

      await tx.payment.create({
        data: {
          bookingId: newBooking.id,
          method: data.paymentMethod,
          status: paymentStatus,
          amount: totalPrice,
          expiresAt,
        },
      });

      // 6. Si es MP, incrementar reservationsUsedMonth
      if (data.paymentMethod === 'MERCADOPAGO' && activeMembership) {
        await tx.userMembership.update({
          where: { id: activeMembership.id },
          data: {
            reservationsUsedMonth: { increment: 1 },
            currentMonthYear: mesActual,
          },
        });
      }

      return newBooking;
    });

    return bookingsRepository.findById(booking.id);
  }

  async cancel(id: string, requestUserId: string, isAdmin: boolean) {
    const booking = await this.findById(id);

    // Verificar cancelaciones habilitadas
    const cancellationsConfig = await prisma.systemConfig.findUnique({
      where: { key: 'cancellations_enabled' },
    });
    if (cancellationsConfig?.value !== 'true' && !isAdmin) {
      throw new ValidationError('Las cancelaciones están deshabilitadas');
    }

    // Solo el dueño de la reserva O un admin pueden cancelar
    if (booking.userId !== requestUserId && !isAdmin) {
      throw new AuthorizationError('No tienes permiso para cancelar esta reserva');
    }

    if (booking.status === 'CANCELLED') {
      throw new ValidationError('La reserva ya está cancelada');
    }

    await prisma.$transaction(async (tx) => {
      // Marcar slot como AVAILABLE
      await tx.slot.update({
        where: { id: booking.slotId },
        data: { status: 'AVAILABLE' },
      });

      // Si es MP y estaba confirmada, marcar payment como REFUNDED
      if (booking.payment && booking.status === 'CONFIRMED' && booking.payment.method === 'MERCADOPAGO') {
        await tx.payment.update({
          where: { id: booking.payment.id },
          data: { status: 'REFUNDED' },
        });
      }

      // Marcar booking como CANCELLED
      await tx.booking.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelledBy: requestUserId,
        },
      });
    });
  }
}

export const bookingsService = new BookingsService();
