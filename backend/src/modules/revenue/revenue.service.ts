import { prisma } from '../../infrastructure/database/client.js';
import { NotFoundError } from '../../shared/errors/NotFoundError.js';
import type { UpsertRevenueConfigInput } from './revenue.schema.js';

export class RevenueService {
  async findAll() {
    const sportTypes = await prisma.sportType.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    return Promise.all(
      sportTypes.map(async (st) => ({
        sportType: st,
        config: await this.findOrCreateConfig(st.id),
      }))
    );
  }

  async findBySportType(sportTypeId: string) {
    const sportType = await prisma.sportType.findUnique({ where: { id: sportTypeId } });
    if (!sportType) throw new NotFoundError('Tipo de deporte');
    return { sportType, config: await this.findOrCreateConfig(sportTypeId) };
  }

  private async findOrCreateConfig(sportTypeId: string) {
    let config = await prisma.pricingConfig.findUnique({
      where: { sportTypeId },
      include: {
        timeRules: { orderBy: { startTime: 'asc' } },
        dayRules: { orderBy: { dayType: 'asc' } },
        occupancyRules: { orderBy: { minOccupancy: 'asc' } },
      },
    });

    if (!config) {
      config = await prisma.pricingConfig.create({
        data: { sportTypeId, basePrice: 0, minPrice: 0, maxPrice: 999999, roundingStep: 0, enabled: false },
        include: { timeRules: true, dayRules: true, occupancyRules: true },
      });
    }
    return config;
  }

  async upsert(sportTypeId: string, data: UpsertRevenueConfigInput) {
    const sportType = await prisma.sportType.findUnique({ where: { id: sportTypeId } });
    if (!sportType) throw new NotFoundError('Tipo de deporte');

    await prisma.$transaction(async (tx) => {
      const config = await tx.pricingConfig.upsert({
        where: { sportTypeId },
        create: { sportTypeId, basePrice: 0, enabled: data.enabled, minPrice: data.minPrice, maxPrice: data.maxPrice, roundingStep: data.roundingStep },
        update: { enabled: data.enabled, minPrice: data.minPrice, maxPrice: data.maxPrice, roundingStep: data.roundingStep },
      });

      await tx.revenueTimeRule.deleteMany({ where: { pricingConfigId: config.id } });
      if (data.timeRules.length > 0) {
        await tx.revenueTimeRule.createMany({
          data: data.timeRules.map((r) => ({ pricingConfigId: config.id, label: r.label, startTime: r.startTime, endTime: r.endTime, multiplier: r.multiplier })),
        });
      }

      await tx.revenueDayRule.deleteMany({ where: { pricingConfigId: config.id } });
      if (data.dayRules.length > 0) {
        await tx.revenueDayRule.createMany({
          data: data.dayRules.map((r) => ({ pricingConfigId: config.id, dayType: r.dayType, multiplier: r.multiplier, label: r.label })),
        });
      }

      await tx.revenueOccupancyRule.deleteMany({ where: { pricingConfigId: config.id } });
      if (data.occupancyRules.length > 0) {
        await tx.revenueOccupancyRule.createMany({
          data: data.occupancyRules.map((r) => ({ pricingConfigId: config.id, minOccupancy: r.minOccupancy, maxOccupancy: r.maxOccupancy, multiplier: r.multiplier })),
        });
      }
    });

    return this.findBySportType(sportTypeId);
  }
}

export const revenueService = new RevenueService();
