import { prisma } from '../../infrastructure/database/client.js';
import { NotFoundError } from '../../shared/errors/NotFoundError.js';
import { ValidationError } from '../../shared/errors/ValidationError.js';
import { AuthorizationError } from '../../shared/errors/AuthorizationError.js';
import type { TransferProofInput, ValidateTransferInput } from './payments.schema.js';

function formatMonthYear(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${y}-${m}`;
}

export class PaymentsService {
  async findAll(method?: string) {
    return prisma.payment.findMany({
      where: method ? { method } : undefined,
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
