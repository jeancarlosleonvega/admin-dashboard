import { prisma } from '../../infrastructure/database/client.js';
import type { CreateVenueScheduleInput, UpdateVenueScheduleInput } from './venue-schedules.schema.js';

const scheduleInclude = {
  venue: {
    select: {
      id: true,
      name: true,
      sportType: {
        select: { id: true, name: true },
      },
      operatingHours: true,
    },
  },
  timeRanges: {
    include: {
      rules: {
        include: {
          conditions: {
            include: { conditionType: true },
            orderBy: { order: 'asc' as const },
          },
        },
        orderBy: { createdAt: 'asc' as const },
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
    return prisma.$transaction(async (tx) => {
      const schedule = await tx.venueSchedule.create({
        data: {
          venueId: data.venueId,
          name: data.name,
          startDate: data.startDate ? new Date(data.startDate) : null,
          endDate: data.endDate ? new Date(data.endDate) : null,
          active: data.active ?? true,
        },
      });

      for (const tr of data.timeRanges) {
        const timeRange = await tx.scheduleTimeRange.create({
          data: {
            scheduleId: schedule.id,
            daysOfWeek: tr.daysOfWeek,
            startTime: tr.startTime,
            endTime: tr.endTime,
            intervalMinutes: tr.intervalMinutes,
            playersPerSlot: tr.playersPerSlot,
            active: tr.active ?? true,
          },
        });

        if (tr.rules && tr.rules.length > 0) {
          for (const rule of tr.rules) {
            await tx.scheduleRule.create({
              data: {
                timeRangeId: timeRange.id,
                canBook: rule.canBook,
                priceOverride: rule.priceOverride ?? null,
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
      }

      return tx.venueSchedule.findUnique({
        where: { id: schedule.id },
        include: scheduleInclude,
      });
    });
  }

  async update(id: string, data: UpdateVenueScheduleInput) {
    return prisma.$transaction(async (tx) => {
      await tx.venueSchedule.update({
        where: { id },
        data: {
          name: data.name,
          startDate: data.startDate !== undefined ? (data.startDate ? new Date(data.startDate) : null) : undefined,
          endDate: data.endDate !== undefined ? (data.endDate ? new Date(data.endDate) : null) : undefined,
          active: data.active,
        },
      });

      if (data.timeRanges !== undefined) {
        // Delete all existing timeRanges (cascade deletes rules + conditions)
        await tx.scheduleTimeRange.deleteMany({ where: { scheduleId: id } });

        for (const tr of data.timeRanges) {
          const timeRange = await tx.scheduleTimeRange.create({
            data: {
              scheduleId: id,
              daysOfWeek: tr.daysOfWeek,
              startTime: tr.startTime,
              endTime: tr.endTime,
              intervalMinutes: tr.intervalMinutes,
              playersPerSlot: tr.playersPerSlot,
              active: tr.active ?? true,
            },
          });

          if (tr.rules && tr.rules.length > 0) {
            for (const rule of tr.rules) {
              await tx.scheduleRule.create({
                data: {
                  timeRangeId: timeRange.id,
                  canBook: rule.canBook,
                  priceOverride: rule.priceOverride ?? null,
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
        }
      }

      return tx.venueSchedule.findUnique({
        where: { id },
        include: scheduleInclude,
      });
    });
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
