import { prisma } from '../../infrastructure/database/client.js';
import type { CreateMembershipPlanInput, UpdateMembershipPlanInput } from './membership-plans.schema.js';
import type { MembershipPlanWithSportType } from './membership-plans.types.js';

const include = {
  sportType: { select: { id: true, name: true } },
  sportPrices: true,
};

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
    return prisma.membershipPlan.findUnique({ where: { id }, include }) as any;
  }

  async findByName(name: string): Promise<MembershipPlanWithSportType | null> {
    return prisma.membershipPlan.findUnique({ where: { name }, include }) as any;
  }

  async create(data: CreateMembershipPlanInput): Promise<MembershipPlanWithSportType> {
    const { sportPrices, ...planData } = data;

    const plan = await prisma.membershipPlan.create({
      data: { ...planData, price: planData.price },
      include,
    });

    if (sportPrices && sportPrices.length > 0) {
      await prisma.membershipPlanSportPrice.createMany({
        data: sportPrices.map((sp) => ({
          membershipPlanId: plan.id,
          sportTypeId: sp.sportTypeId,
          baseBookingPrice: sp.baseBookingPrice,
        })),
      });
    }

    return prisma.membershipPlan.findUnique({ where: { id: plan.id }, include }) as any;
  }

  async update(id: string, data: UpdateMembershipPlanInput): Promise<MembershipPlanWithSportType> {
    const { sportPrices, ...planData } = data;

    await prisma.membershipPlan.update({ where: { id }, data: planData });

    if (sportPrices !== undefined) {
      await prisma.membershipPlanSportPrice.deleteMany({ where: { membershipPlanId: id } });
      if (sportPrices.length > 0) {
        await prisma.membershipPlanSportPrice.createMany({
          data: sportPrices.map((sp) => ({
            membershipPlanId: id,
            sportTypeId: sp.sportTypeId,
            baseBookingPrice: sp.baseBookingPrice,
          })),
        });
      }
    }

    return prisma.membershipPlan.findUnique({ where: { id }, include }) as any;
  }

  async delete(id: string): Promise<void> {
    await prisma.membershipPlan.delete({ where: { id } });
  }
}

export const membershipPlansRepository = new MembershipPlansRepository();
