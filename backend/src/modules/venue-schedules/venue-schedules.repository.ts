import { prisma } from '../../infrastructure/database/client.js';
import type { CreateVenueScheduleInput, UpdateVenueScheduleInput } from './venue-schedules.schema.js';

const scheduleInclude = {
  venue: {
    select: {
      id: true,
      name: true,
      intervalMinutes: true,
      playersPerSlot: true,
      openTime: true,
      closeTime: true,
      sportType: {
        select: {
          id: true,
          name: true,
          defaultIntervalMinutes: true,
          defaultPlayersPerSlot: true,
          defaultOpenTime: true,
          defaultCloseTime: true,
        },
      },
    },
  },
  rules: {
    include: {
      conditions: {
        include: {
          conditionType: true,
        },
        orderBy: { order: 'asc' as const },
      },
    },
    orderBy: { createdAt: 'asc' as const },
  },
};

export class VenueSchedulesRepository {
  async findAll(venueId?: string, page = 1, limit = 20) {
    const where: any = {};
    if (venueId) where.venueId = venueId;

    const [items, total] = await Promise.all([
      prisma.venueSchedule.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: scheduleInclude,
      }),
      prisma.venueSchedule.count({ where }),
    ]);

    return { items, total };
  }

  async findById(id: string) {
    return prisma.venueSchedule.findUnique({
      where: { id },
      include: scheduleInclude,
    });
  }

  async create(data: CreateVenueScheduleInput) {
    const schedule = await prisma.venueSchedule.create({
      data: {
        venueId: data.venueId,
        name: data.name,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        daysOfWeek: data.daysOfWeek,
        openTime: data.openTime ?? null,
        closeTime: data.closeTime ?? null,
        intervalMinutes: data.intervalMinutes ?? null,
        playersPerSlot: data.playersPerSlot ?? null,
        active: data.active,
      },
      include: scheduleInclude,
    });

    if (data.rules && data.rules.length > 0) {
      await this.upsertRules(schedule.id, data.rules);
    }

    return prisma.venueSchedule.findUnique({ where: { id: schedule.id }, include: scheduleInclude });
  }

  async update(id: string, data: UpdateVenueScheduleInput) {
    await prisma.venueSchedule.update({
      where: { id },
      data: {
        venueId: data.venueId,
        name: data.name,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate !== undefined ? (data.endDate ? new Date(data.endDate) : null) : undefined,
        daysOfWeek: data.daysOfWeek,
        openTime: data.openTime !== undefined ? (data.openTime ?? null) : undefined,
        closeTime: data.closeTime !== undefined ? (data.closeTime ?? null) : undefined,
        intervalMinutes: data.intervalMinutes !== undefined ? (data.intervalMinutes ?? null) : undefined,
        playersPerSlot: data.playersPerSlot !== undefined ? (data.playersPerSlot ?? null) : undefined,
        active: data.active,
      },
    });

    if (data.rules !== undefined) {
      await this.upsertRules(id, data.rules ?? []);
    }

    return prisma.venueSchedule.findUnique({ where: { id }, include: scheduleInclude });
  }

  private async upsertRules(scheduleId: string, rules: NonNullable<CreateVenueScheduleInput['rules']>) {
    // Delete existing rules (cascade deletes conditions)
    await prisma.scheduleRule.deleteMany({ where: { scheduleId } });

    // Re-create
    for (const rule of rules) {
      await prisma.scheduleRule.create({
        data: {
          scheduleId,
          canBook: rule.canBook,
          basePrice: rule.basePrice,
          revenueManagementEnabled: rule.revenueManagementEnabled,
          conditions: {
            create: rule.conditions.map((c) => ({
              conditionTypeId: c.conditionTypeId,
              operator: c.operator,
              value: c.value,
              logicalOperator: c.logicalOperator ?? null,
              order: c.order,
            })),
          },
        },
      });
    }
  }

  async updateGeneratedUntil(id: string, generatedUntil: Date | null) {
    await prisma.venueSchedule.update({
      where: { id },
      data: { generatedUntil },
    });
  }

  async delete(id: string) {
    await prisma.venueSchedule.delete({ where: { id } });
  }
}

export const venueSchedulesRepository = new VenueSchedulesRepository();
