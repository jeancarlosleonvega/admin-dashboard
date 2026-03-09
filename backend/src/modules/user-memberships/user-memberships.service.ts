import { userMembershipsRepository } from './user-memberships.repository.js';
import { NotFoundError } from '../../shared/errors/NotFoundError.js';
import { ValidationError } from '../../shared/errors/ValidationError.js';
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
      // Cancelar la activa antes de asignar nueva
      await userMembershipsRepository.cancelActiveForUser(data.userId);
    }
    return userMembershipsRepository.create(data);
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
