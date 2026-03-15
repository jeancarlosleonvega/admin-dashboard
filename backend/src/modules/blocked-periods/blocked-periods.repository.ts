import { prisma } from '../../infrastructure/database/client.js';
import type { CreateBlockedPeriodInput, UpdateBlockedPeriodInput } from './blocked-periods.schema.js';

const blockedPeriodInclude = {
  sportType: { select: { id: true, name: true } },
  venue: { select: { id: true, name: true, sportType: { select: { id: true, name: true } } } },
};

export class BlockedPeriodsRepository {
  async findAll(
    filters: { sportTypeId?: string; venueId?: string; startDate?: string; endDate?: string },
    page = 1,
    limit = 20
  ) {
    const where: any = {};
    if (filters.sportTypeId) where.sportTypeId = filters.sportTypeId;
    if (filters.venueId) where.venueId = filters.venueId;
    if (filters.startDate || filters.endDate) {
      where.AND = [];
      if (filters.startDate) where.AND.push({ endDate: { gte: new Date(filters.startDate) } });
      if (filters.endDate) where.AND.push({ startDate: { lte: new Date(filters.endDate) } });
    }

    const [items, total] = await Promise.all([
      prisma.blockedPeriod.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { startDate: 'asc' },
        include: blockedPeriodInclude,
      }),
      prisma.blockedPeriod.count({ where }),
    ]);

    return { items, total };
  }

  async findById(id: string) {
    return prisma.blockedPeriod.findUnique({
      where: { id },
      include: blockedPeriodInclude,
    });
  }

  async findActiveOverlapping(startDate: Date, endDate: Date, venueId?: string | null, sportTypeId?: string | null) {
    const where: any = {
      active: true,
      startDate: { lte: endDate },
      endDate: { gte: startDate },
    };

    const orConditions: any[] = [
      { sportTypeId: null, venueId: null },
    ];
    if (sportTypeId) orConditions.push({ sportTypeId });
    if (venueId) orConditions.push({ venueId });

    where.OR = orConditions;
    return prisma.blockedPeriod.findMany({ where });
  }

  async create(data: CreateBlockedPeriodInput) {
    return prisma.blockedPeriod.create({
      data: {
        sportTypeId: data.sportTypeId ?? null,
        venueId: data.venueId ?? null,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        startTime: data.startTime ?? null,
        endTime: data.endTime ?? null,
        reason: data.reason,
        active: data.active,
      },
      include: blockedPeriodInclude,
    });
  }

  async update(id: string, data: UpdateBlockedPeriodInput) {
    return prisma.blockedPeriod.update({
      where: { id },
      data: {
        sportTypeId: data.sportTypeId !== undefined ? (data.sportTypeId ?? null) : undefined,
        venueId: data.venueId !== undefined ? (data.venueId ?? null) : undefined,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        startTime: data.startTime !== undefined ? (data.startTime ?? null) : undefined,
        endTime: data.endTime !== undefined ? (data.endTime ?? null) : undefined,
        reason: data.reason,
        active: data.active,
      },
      include: blockedPeriodInclude,
    });
  }

  async delete(id: string) {
    await prisma.blockedPeriod.delete({ where: { id } });
  }
}

export const blockedPeriodsRepository = new BlockedPeriodsRepository();
