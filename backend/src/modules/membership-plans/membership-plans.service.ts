import { membershipPlansRepository } from './membership-plans.repository.js';
import { NotFoundError } from '../../shared/errors/NotFoundError.js';
import { ValidationError } from '../../shared/errors/ValidationError.js';
import type { CreateMembershipPlanInput, UpdateMembershipPlanInput, MembershipPlanFiltersInput } from './membership-plans.schema.js';
import type { MembershipPlanWithSportType } from './membership-plans.types.js';

export class MembershipPlansService {
  async findAll(filters: MembershipPlanFiltersInput) {
    const { page, limit, ...rest } = filters;
    const { items, total } = await membershipPlansRepository.findAll(rest, page, limit);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string): Promise<MembershipPlanWithSportType> {
    const item = await membershipPlansRepository.findById(id);
    if (!item) throw new NotFoundError('Plan de membresía');
    return item;
  }

  async create(data: CreateMembershipPlanInput): Promise<MembershipPlanWithSportType> {
    const existing = await membershipPlansRepository.findByName(data.name);
    if (existing) throw new ValidationError('Ya existe un plan con ese nombre');
    return membershipPlansRepository.create(data);
  }

  async update(id: string, data: UpdateMembershipPlanInput): Promise<MembershipPlanWithSportType> {
    await this.findById(id);
    if (data.name) {
      const existing = await membershipPlansRepository.findByName(data.name);
      if (existing && existing.id !== id) throw new ValidationError('Ya existe un plan con ese nombre');
    }
    return membershipPlansRepository.update(id, data);
  }

  async findActive(): Promise<MembershipPlanWithSportType[]> {
    const { items } = await membershipPlansRepository.findAll({ active: 'true' }, 1, 100);
    return items;
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await membershipPlansRepository.delete(id);
  }
}

export const membershipPlansService = new MembershipPlansService();
