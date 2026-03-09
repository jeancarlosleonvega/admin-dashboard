import { prisma } from '../../infrastructure/database/client.js';
import { NotFoundError } from '../../shared/errors/NotFoundError.js';
import { ValidationError } from '../../shared/errors/ValidationError.js';

export class QRService {
  async validate(code: string) {
    const booking = await prisma.booking.findFirst({
      where: { qrCode: code },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
        slot: {
          include: {
            venue: { select: { id: true, name: true } },
          },
        },
        bookingServices: {
          include: {
            service: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!booking) throw new NotFoundError('QR no válido');

    if (booking.status !== 'CONFIRMED') {
      throw new ValidationError('La reserva no está confirmada');
    }

    // Verificar que booking.slot.date = hoy
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const slotDate = new Date(booking.slot.date);
    slotDate.setHours(0, 0, 0, 0);

    if (slotDate.getTime() !== today.getTime()) {
      throw new ValidationError('Este QR no corresponde a una reserva de hoy');
    }

    if (booking.qrValidatedAt !== null) {
      throw new ValidationError('Este QR ya fue utilizado');
    }

    // Marcar como validado
    await prisma.booking.update({
      where: { id: booking.id },
      data: { qrValidatedAt: new Date() },
    });

    return {
      valid: true,
      booking: {
        id: booking.id,
        user: booking.user,
        slot: {
          date: booking.slot.date,
          startTime: booking.slot.startTime,
          endTime: booking.slot.endTime,
          venue: booking.slot.venue,
        },
        services: booking.bookingServices.map((bs) => bs.service),
      },
    };
  }
}

export const qrService = new QRService();
