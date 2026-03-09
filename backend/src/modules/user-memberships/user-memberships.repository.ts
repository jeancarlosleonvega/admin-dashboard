import { prisma } from '../../infrastructure/database/client.js';
import type { CreateUserMembershipInput, UpdateUserMembershipInput } from './user-memberships.schema.js';

const membershipInclude = {
  membershipPlan: {
    select: {
      id: true,
      name: true,
      price: true,
      monthlyReservationLimit: true,
    },
  },
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  },
};

export class UserMembershipsRepository {
  async findAll(userId?: string, page = 1, limit = 20) {
    const where: any = {};
    if (userId) where.userId = userId;

    const [items, total] = await Promise.all([
      prisma.userMembership.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: membershipInclude,
      }),
      prisma.userMembership.count({ where }),
    ]);

    return { items, total };
  }

  async findById(id: string) {
    return prisma.userMembership.findUnique({
      where: { id },
      include: membershipInclude,
    });
  }

  async findActiveByUserId(userId: string) {
    return prisma.userMembership.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        OR: [
          { endDate: null },
          { endDate: { gt: new Date() } },
        ],
      },
      include: membershipInclude,
    });
  }

  async create(data: CreateUserMembershipInput) {
    return prisma.userMembership.create({
      data: {
        userId: data.userId,
        membershipPlanId: data.membershipPlanId,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        notes: data.notes,
        status: 'ACTIVE',
      },
      include: membershipInclude,
    });
  }

  async update(id: string, data: UpdateUserMembershipInput) {
    return prisma.userMembership.update({
      where: { id },
      data: {
        status: data.status,
        endDate: data.endDate !== undefined ? (data.endDate ? new Date(data.endDate) : null) : undefined,
        notes: data.notes,
      },
      include: membershipInclude,
    });
  }

  async cancelActiveForUser(userId: string) {
    await prisma.userMembership.updateMany({
      where: { userId, status: 'ACTIVE' },
      data: { status: 'CANCELLED' },
    });
  }

  async delete(id: string) {
    await prisma.userMembership.delete({ where: { id } });
  }
}

export const userMembershipsRepository = new UserMembershipsRepository();
