import { prisma } from '../../infrastructure/database/client.js';
import type { CreateConditionTypeInput, UpdateConditionTypeInput } from './condition-types.schema.js';
import type { ConditionType } from './condition-types.types.js';

export class ConditionTypesRepository {
  async findAll(filters: { search?: string; active?: string }, page: number, limit: number) {
    const where: any = {};
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { key: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    if (filters.active !== undefined) {
      where.active = filters.active === 'true';
    }

    const [items, total] = await Promise.all([
      prisma.conditionType.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { name: 'asc' } }),
      prisma.conditionType.count({ where }),
    ]);
    return { items, total };
  }

  async findById(id: string): Promise<ConditionType | null> {
    return prisma.conditionType.findUnique({ where: { id } });
  }

  async findByKey(key: string): Promise<ConditionType | null> {
    return prisma.conditionType.findUnique({ where: { key } });
  }

  async create(data: CreateConditionTypeInput): Promise<ConditionType> {
    return prisma.conditionType.create({ data });
  }

  async update(id: string, data: UpdateConditionTypeInput): Promise<ConditionType> {
    return prisma.conditionType.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.conditionType.delete({ where: { id } });
  }
}

export const conditionTypesRepository = new ConditionTypesRepository();
