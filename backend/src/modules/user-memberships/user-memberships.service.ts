import { userMembershipsRepository } from './user-memberships.repository.js';
import { walletService } from '../wallet/wallet.service.js';
import { prisma } from '../../infrastructure/database/client.js';
import { NotFoundError } from '../../shared/errors/NotFoundError.js';
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
}

export const userMembershipsService = new UserMembershipsService();
