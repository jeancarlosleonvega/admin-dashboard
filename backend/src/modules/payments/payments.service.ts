import { prisma } from '../../infrastructure/database/client.js';
import { NotFoundError } from '../../shared/errors/NotFoundError.js';
import { ValidationError } from '../../shared/errors/ValidationError.js';
import { AuthorizationError } from '../../shared/errors/AuthorizationError.js';
import { emailService } from '../../shared/services/email.service.js';
import { env } from '../../config/env.js';
import type { TransferProofInput, ValidateTransferInput } from './payments.schema.js';

function formatMonthYear(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${y}-${m}`;
}

const venueSelect = { id: true, name: true, sportType: { select: { id: true, name: true } } };

export class PaymentsService {
  async findMy(userId: string) {
    return prisma.payment.findMany({
      where: { booking: { userId } },
      include: {
        booking: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
            slot: { include: { venue: { select: venueSelect } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll(method?: string) {
    return prisma.payment.findMany({
      where: method ? { method: method as any } : undefined,
      include: {
        booking: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
            slot: { include: { venue: { select: { id: true, name: true, sportType: { select: { id: true, name: true } } } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPendingTransfers() {
    return prisma.payment.findMany({
      where: {
        status: { in: ['PENDING_PROOF', 'PENDING_VALIDATION'] },
        method: 'TRANSFER',
      },
      include: {
        booking: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
            slot: {
              include: {
                venue: { select: { id: true, name: true, sportType: { select: { id: true, name: true } } } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async uploadTransferProof(paymentId: string, requestUserId: string, data: TransferProofInput) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { booking: true },
    });

    if (!payment) throw new NotFoundError('Pago');
    if (payment.booking.userId !== requestUserId) {
      throw new AuthorizationError('No tienes permiso para modificar este pago');
    }
    if (payment.status !== 'PENDING_PROOF') {
      throw new ValidationError('El pago no está en estado de espera de comprobante');
    }

    return prisma.payment.update({
      where: { id: paymentId },
      data: {
        transferProofUrl: data.proofUrl,
        transferProofUploadedAt: new Date(),
        status: 'PENDING_VALIDATION',
      },
      include: {
        booking: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        },
      },
    });
  }

  async validateTransfer(paymentId: string, adminUserId: string, data: ValidateTransferInput) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: {
          include: { slot: true },
        },
      },
    });

    if (!payment) throw new NotFoundError('Pago');
    if (payment.status !== 'PENDING_VALIDATION') {
      throw new ValidationError('El pago no está en estado de validación pendiente');
    }

    // Obtener datos completos para emails
    const paymentFull = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: {
          include: {
            user: { select: { email: true, firstName: true } },
            slot: { include: { venue: { select: venueSelect } } },
          },
        },
      },
    });

    if (data.approved) {
      const qrCode = crypto.randomUUID();
      const mesActual = formatMonthYear(new Date());

      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: paymentId },
          data: {
            status: 'APPROVED',
            approvedByUserId: adminUserId,
            approvedAt: new Date(),
          },
        });

        await tx.booking.update({
          where: { id: payment.bookingId },
          data: { status: 'CONFIRMED', qrCode },
        });

        // Incrementar reservationsUsedMonth si aplica
        const booking = await tx.booking.findUnique({
          where: { id: payment.bookingId },
          select: { membershipPlanId: true, userId: true },
        });

        if (booking?.membershipPlanId) {
          const membership = await tx.userMembership.findFirst({
            where: {
              userId: booking.userId,
              membershipPlanId: booking.membershipPlanId,
              status: 'ACTIVE',
            },
          });
          if (membership) {
            await tx.userMembership.update({
              where: { id: membership.id },
              data: {
                reservationsUsedMonth: { increment: 1 },
                currentMonthYear: mesActual,
              },
            });
          }
        }
      });
      // Email: transferencia aprobada
      if (paymentFull) {
        const { user, slot } = paymentFull.booking;
        emailService.sendTransferApproved(user.email, {
          firstName: user.firstName,
          venueName: slot.venue?.name ?? '',
          sportName: (slot.venue as any)?.sportType?.name ?? '',
          date: new Date(slot.date).toLocaleDateString('es-AR'),
          startTime: slot.startTime,
          endTime: slot.endTime,
          qrCode,
        }).catch(() => {});
      }
    } else {
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: paymentId },
          data: {
            status: 'REJECTED',
            rejectionReason: data.reason,
          },
        });

        await tx.booking.update({
          where: { id: payment.bookingId },
          data: {
            status: 'CANCELLED',
            cancelledAt: new Date(),
            cancelledBy: adminUserId,
          },
        });

        await tx.slot.update({
          where: { id: payment.booking.slotId },
          data: { status: 'AVAILABLE' },
        });
      });

      // Email: transferencia rechazada
      if (paymentFull) {
        const { user, slot } = paymentFull.booking;
        emailService.sendTransferRejected(user.email, {
          firstName: user.firstName,
          venueName: slot.venue?.name ?? '',
          sportName: (slot.venue as any)?.sportType?.name ?? '',
          date: new Date(slot.date).toLocaleDateString('es-AR'),
          startTime: slot.startTime,
          endTime: slot.endTime,
          reason: data.reason,
          appUrl: env.APP_URL ?? '',
        }).catch(() => {});
      }
    }

    return prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        },
      },
    });
  }
}

export const paymentsService = new PaymentsService();
