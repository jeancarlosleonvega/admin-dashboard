import { prisma } from '../../infrastructure/database/client.js';
import { NotFoundError } from '../../shared/errors/NotFoundError.js';
import { ValidationError } from '../../shared/errors/ValidationError.js';
import { broadcast } from '../../shared/utils/wsBroadcast.js';
import type { UpsertRevenueConfigInput, CreateFactorTypeInput, UpdateFactorTypeInput } from './revenue.schema.js';

export class RevenueService {
  // ─── Factor Types ───────────────────────────────────────────
  async findAllFactorTypes() {
    return prisma.revenueFactorType.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
  }

  async createFactorType(data: CreateFactorTypeInput) {
    const existing = await prisma.revenueFactorType.findUnique({ where: { key: data.key } });
    if (existing) throw new ValidationError('Ya existe un factor con esa clave');
    return prisma.revenueFactorType.create({ data });
  }

  async updateFactorType(id: string, data: UpdateFactorTypeInput) {
    const ft = await prisma.revenueFactorType.findUnique({ where: { id } });
    if (!ft) throw new NotFoundError('Tipo de factor');
    return prisma.revenueFactorType.update({ where: { id }, data });
  }

  async deleteFactorType(id: string) {
    const ft = await prisma.revenueFactorType.findUnique({ where: { id } });
    if (!ft) throw new NotFoundError('Tipo de factor');
    if (ft.isSystem) throw new ValidationError('No se pueden eliminar factores del sistema');
    const result = await prisma.revenueFactorType.update({ where: { id }, data: { active: false } });
    broadcast('slots:invalidate', { source: 'El precio cambió' });
    return result;
  }

  // ─── Config por SportType ────────────────────────────────────
  async findAll() {
    const sportTypes = await prisma.sportType.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    return Promise.all(
      sportTypes.map(async (st) => ({ sportType: st, config: await this.findOrCreateConfig(st.id) }))
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
        factors: {
          include: {
            factorType: true,
            rules: { orderBy: { createdAt: 'asc' } },
          },
        },
      },
    });
    if (!config) {
      config = await prisma.pricingConfig.create({
        data: { sportTypeId, basePrice: 0, minPrice: 0, maxPrice: 999999, roundingStep: 0, enabled: false },
        include: { factors: { include: { factorType: true, rules: true } } },
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

      // Para cada factor en el payload: upsert factor + replace rules
      for (const f of data.factors) {
        const factor = await tx.revenueFactor.upsert({
          where: { pricingConfigId_factorTypeId: { pricingConfigId: config.id, factorTypeId: f.factorTypeId } },
          create: { pricingConfigId: config.id, factorTypeId: f.factorTypeId, enabled: f.enabled },
          update: { enabled: f.enabled },
        });

        await tx.revenueFactorRule.deleteMany({ where: { factorId: factor.id } });
        if (f.rules.length > 0) {
          await tx.revenueFactorRule.createMany({
            data: f.rules.map((r) => ({
              factorId: factor.id,
              minValue: r.minValue ?? null,
              maxValue: r.maxValue ?? null,
              enumValue: r.enumValue ?? null,
              multiplier: r.multiplier,
              label: r.label ?? null,
            })),
          });
        }
      }

      // Eliminar factores que ya no están en el payload
      const factorTypeIds = data.factors.map((f) => f.factorTypeId);
      await tx.revenueFactor.deleteMany({
        where: { pricingConfigId: config.id, factorTypeId: { notIn: factorTypeIds } },
      });
    });

    broadcast('slots:invalidate', { source: 'El precio cambió' });
    return this.findBySportType(sportTypeId);
  }
}

export const revenueService = new RevenueService();
