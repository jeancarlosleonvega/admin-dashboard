import { prisma } from '../../infrastructure/database/client.js';

const include = {
  createdBy: { select: { firstName: true, lastName: true } },
  liftedBy: { select: { firstName: true, lastName: true } },
} as const;

export const userSuspensionsRepository = {
  findByUser(userId: string) {
    return prisma.userSuspension.findMany({
      where: { userId },
      include,
      orderBy: { createdAt: 'desc' },
    });
  },

  findById(id: string) {
    return prisma.userSuspension.findUnique({ where: { id }, include });
  },

  findActive(userId: string) {
    return prisma.userSuspension.findFirst({
      where: {
        userId,
        liftedAt: null,
        OR: [{ endDate: null }, { endDate: { gt: new Date() } }],
      },
    });
  },

  create(data: {
    userId: string;
    reason: string;
    startDate: Date;
    endDate?: Date | null;
    isAutomatic?: boolean;
    createdById: string;
  }) {
    return prisma.userSuspension.create({ data, include });
  },

  lift(id: string, liftedById: string) {
    return prisma.userSuspension.update({
      where: { id },
      data: { liftedAt: new Date(), liftedById },
      include,
    });
  },
};
