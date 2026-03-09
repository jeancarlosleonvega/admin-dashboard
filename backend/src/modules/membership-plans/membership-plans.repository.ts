import { prisma } from '../../infrastructure/database/client.js';
import type { CreateMembershipPlanInput, UpdateMembershipPlanInput } from './membership-plans.schema.js';
import type { MembershipPlanWithSportType } from './membership-plans.types.js';

const include = { sportType: { select: { id: true, name: true } } };

export class MembershipPlansRepository {
  async findAll(filters: { search?: string; active?: string; sportTypeId?: string }, page: number, limit: number) {
    const where: any = {};
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    if (filters.active !== undefined) where.active = filters.active === 'true';
    if (filters.sportTypeId) where.sportTypeId = filters.sportTypeId;

    const [items, total] = await Promise.all([
      prisma.membershipPlan.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { name: 'asc' }, include }),
      prisma.membershipPlan.count({ where }),
    ]);
    return { items, total };
  }

  async findById(id: string): Promise<MembershipPlanWithSportType | null> {
    return prisma.membershipPlan.findUnique({ where: { id }, include });
  }

  async findByName(name: string): Promise<MembershipPlanWithSportType | null> {
    return prisma.membershipPlan.findUnique({ where: { name }, include });
  }

  async create(data: CreateMembershipPlanInput): Promise<MembershipPlanWithSportType> {
    return prisma.membershipPlan.create({ data: { ...data, price: data.price }, include });
  }

  async update(id: string, data: UpdateMembershipPlanInput): Promise<MembershipPlanWithSportType> {
    return prisma.membershipPlan.update({ where: { id }, data, include });
  }

  async delete(id: string): Promise<void> {
    await prisma.membershipPlan.delete({ where: { id } });
  }
}

export const membershipPlansRepository = new MembershipPlansRepository();
