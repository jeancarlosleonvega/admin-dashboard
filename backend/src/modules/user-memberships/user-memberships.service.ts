import { userMembershipsRepository } from './user-memberships.repository.js';
import { walletService } from '../wallet/wallet.service.js';
import { prisma } from '../../infrastructure/database/client.js';
import { NotFoundError } from '../../shared/errors/NotFoundError.js';
import { ValidationError } from '../../shared/errors/ValidationError.js';
import { mpService } from '../../shared/services/mp.service.js';
import { membershipPlansService } from '../membership-plans/membership-plans.service.js';
import { env } from '../../config/env.js';
import { logger } from '../../shared/utils/logger.js';
import type { CreateUserMembershipInput, UpdateUserMembershipInput, UserMembershipFiltersInput } from './user-memberships.schema.js';

export class UserMembershipsService {
  async findAll(filters: UserMembershipFiltersInput) {
    const { page, limit, userId } = filters;
    const { items, total } = await userMembershipsRepository.findAll(userId, page, limit);
    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string) {
    const item = await userMembershipsRepository.findById(id);
    if (!item) throw new NotFoundError('Membresía de socio');
    return item;
  }

  async findMyActiveMembership(userId: string) {
    return userMembershipsRepository.findActiveByUserId(userId);
  }

  async create(data: CreateUserMembershipInput) {
    // Un usuario solo puede tener UNA membresía activa a la vez
    const existing = await userMembershipsRepository.findActiveByUserId(data.userId);
    if (existing) {
      await userMembershipsRepository.cancelActiveForUser(data.userId);
    }

    const membership = await userMembershipsRepository.create(data);

    // Acreditar wallet si el plan lo tiene habilitado
    const plan = await prisma.membershipPlan.findUnique({
      where: { id: data.membershipPlanId },
      select: { walletCreditEnabled: true, walletCreditAmount: true, name: true },
    });

    if (plan?.walletCreditEnabled && plan.walletCreditAmount) {
      const amount = parseFloat(plan.walletCreditAmount.toString());
      if (amount > 0) {
        await walletService.credit(
          data.userId,
          amount,
          'membership',
          membership.id,
          `Crédito por membresía ${plan.name}`,
        );
      }
    }

    return membership;
  }

  async update(id: string, data: UpdateUserMembershipInput) {
    await this.findById(id);
    return userMembershipsRepository.update(id, data);
  }

  async delete(id: string) {
    await this.findById(id);
    // Cancelar en lugar de borrar físicamente
    await userMembershipsRepository.update(id, { status: 'CANCELLED' });
  }

  async subscribe(userId: string, membershipPlanId: string): Promise<{ initPoint: string }> {
    if (!mpService.isConfigured()) {
      throw new ValidationError('El pago online no está disponible en este momento');
    }

    const plan = await membershipPlansService.findById(membershipPlanId);
    if (!plan.active) throw new ValidationError('Plan no disponible');

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, firstName: true },
    });
    if (!user) throw new NotFoundError('Usuario');

    // Cancelar membresía activa previa (si existe)
    const existing = await userMembershipsRepository.findActiveByUserId(userId);
    if (existing) {
      await userMembershipsRepository.cancelActiveForUser(userId);
      if ((existing as any).mpSubscriptionId) {
        await mpService.cancelSubscription((existing as any).mpSubscriptionId);
      }
    }

    // Crear membresía en estado PENDING
    const membership = await prisma.userMembership.create({
      data: {
        userId,
        membershipPlanId,
        status: 'PENDING',
        startDate: new Date(),
      },
    });

    // Crear suscripción en MP
    const { id: mpId, initPoint } = await mpService.createSubscription({
      planName: plan.name,
      amount: parseFloat(plan.price.toString()),
      payerEmail: user.email,
      backUrl: `${env.APP_URL}/mi-membresia`,
      externalReference: membership.id,
    });

    // Guardar el ID de la suscripción MP
    await prisma.userMembership.update({
      where: { id: membership.id },
      data: { mpSubscriptionId: mpId },
    });

    return { initPoint };
  }

  async handleMpWebhook(type: string, dataId: string): Promise<void> {
    if (type === 'subscription_preapproval') {
      await this.handleSubscriptionEvent(dataId);
    } else if (type === 'subscription_authorized_payment') {
      await this.handleAuthorizedPayment(dataId);
    }
  }

  private async handleSubscriptionEvent(subscriptionId: string): Promise<void> {
    try {
      const sub = await mpService.getSubscription(subscriptionId);
      const membership = await prisma.userMembership.findFirst({
        where: { mpSubscriptionId: subscriptionId },
        include: { membershipPlan: true },
      });

      if (!membership) {
        logger.warn({ subscriptionId }, 'Membresía no encontrada para suscripción MP');
        return;
      }

      if (sub.status === 'authorized') {
        const now = new Date();
        const endDate = new Date(now);
        endDate.setMonth(endDate.getMonth() + 1);

        await prisma.userMembership.update({
          where: { id: membership.id },
          data: { status: 'ACTIVE', startDate: now, endDate },
        });

        // Acreditar wallet si el plan lo tiene
        const plan = membership.membershipPlan;
        if (plan.walletCreditEnabled && plan.walletCreditAmount) {
          const amount = parseFloat(plan.walletCreditAmount.toString());
          if (amount > 0) {
            await walletService.credit(
              membership.userId,
              amount,
              'membership',
              membership.id,
              `Crédito por membresía ${plan.name}`,
            );
          }
        }

        logger.info({ membershipId: membership.id }, 'Membresía activada por suscripción MP');
      } else if (sub.status === 'cancelled' || sub.status === 'paused') {
        await prisma.userMembership.update({
          where: { id: membership.id },
          data: { status: sub.status === 'cancelled' ? 'CANCELLED' : 'INACTIVE' },
        });
      }
    } catch (err) {
      logger.error({ err, subscriptionId }, 'Error procesando webhook de suscripción MP');
    }
  }

  private async handleAuthorizedPayment(paymentId: string): Promise<void> {
    try {
      // MP sends authorized_payment with preapproval_id in the body
      // We use the external_reference to find our membership
      logger.info({ paymentId }, 'Pago recurrente de membresía recibido');
      // For recurring payments, we extend the membership by 1 month
      // The preapproval webhook handles the main activation - here we just log
    } catch (err) {
      logger.error({ err, paymentId }, 'Error procesando pago autorizado MP');
    }
  }
}

export const userMembershipsService = new UserMembershipsService();
