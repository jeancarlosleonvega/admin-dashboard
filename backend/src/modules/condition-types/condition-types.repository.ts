import { Prisma } from '@prisma/client';
import { prisma } from '../../infrastructure/database/client.js';
import type { CreateConditionTypeInput, UpdateConditionTypeInput } from './condition-types.schema.js';
import type { ConditionType } from './condition-types.types.js';

function toDbJson(val: { value: string; label: string }[] | null | undefined): Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined {
  if (val === null) return Prisma.JsonNull;
  if (val === undefined) return undefined;
  return val as Prisma.InputJsonValue;
}

function mapRow(row: any): ConditionType {
  return { ...row, allowedValues: row.allowedValues ?? null } as ConditionType;
}

export class ConditionTypesRepository {
  async findAll(filters: { search?: string; active?: string; dataType?: string; sortBy?: string; sortDirection?: string }, page: number, limit: number) {
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
    if (filters.dataType) {
      where.dataType = filters.dataType;
    }

    const orderBy: any = filters.sortBy
      ? { [filters.sortBy]: filters.sortDirection ?? 'asc' }
      : { name: 'asc' };

    const [items, total] = await Promise.all([
      prisma.conditionType.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy }),
      prisma.conditionType.count({ where }),
    ]);
    return { items, total };
  }

  async findById(id: string): Promise<ConditionType | null> {
    const row = await prisma.conditionType.findUnique({ where: { id } });
    return row ? mapRow(row) : null;
  }

  async findByKey(key: string): Promise<ConditionType | null> {
    const row = await prisma.conditionType.findUnique({ where: { key } });
    return row ? mapRow(row) : null;
  }

  async create(data: CreateConditionTypeInput): Promise<ConditionType> {
    const row = await prisma.conditionType.create({
      data: { ...data, allowedValues: toDbJson(data.allowedValues) },
    });
    return mapRow(row);
  }

  async update(id: string, data: UpdateConditionTypeInput): Promise<ConditionType> {
    const row = await prisma.conditionType.update({
      where: { id },
      data: { ...data, allowedValues: toDbJson(data.allowedValues) },
    });
    return mapRow(row);
  }

  async delete(id: string): Promise<void> {
    await prisma.conditionType.delete({ where: { id } });
  }
}

export const conditionTypesRepository = new ConditionTypesRepository();
