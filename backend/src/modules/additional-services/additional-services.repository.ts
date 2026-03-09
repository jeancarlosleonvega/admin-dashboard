import { prisma } from '../../infrastructure/database/client.js';
import type { CreateAdditionalServiceInput, UpdateAdditionalServiceInput } from './additional-services.schema.js';

const serviceInclude = {
  sportType: { select: { id: true, name: true } },
};

export class AdditionalServicesRepository {
  async findAll(
    filters: { sportTypeId?: string; active?: string },
    page = 1,
    limit = 20
  ) {
    const where: any = {};
    if (filters.sportTypeId) where.sportTypeId = filters.sportTypeId;
    if (filters.active !== undefined) where.active = filters.active === 'true';

    const [items, total] = await Promise.all([
      prisma.additionalService.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
        include: serviceInclude,
      }),
      prisma.additionalService.count({ where }),
    ]);

    return { items, total };
  }

  async findById(id: string) {
    return prisma.additionalService.findUnique({
      where: { id },
      include: serviceInclude,
    });
  }

  async findByIds(ids: string[]) {
    return prisma.additionalService.findMany({
      where: { id: { in: ids } },
    });
  }

  async create(data: CreateAdditionalServiceInput) {
    return prisma.additionalService.create({
      data: {
        sportTypeId: data.sportTypeId ?? null,
        name: data.name,
        description: data.description,
        price: data.price,
        active: data.active,
      },
      include: serviceInclude,
    });
  }

  async update(id: string, data: UpdateAdditionalServiceInput) {
    return prisma.additionalService.update({
      where: { id },
      data: {
        sportTypeId: data.sportTypeId !== undefined ? (data.sportTypeId ?? null) : undefined,
        name: data.name,
        description: data.description,
        price: data.price,
        active: data.active,
      },
      include: serviceInclude,
    });
  }

  async delete(id: string) {
    await prisma.additionalService.delete({ where: { id } });
  }
}

export const additionalServicesRepository = new AdditionalServicesRepository();
