import { prisma } from '../../infrastructure/database/client.js';
import type { CreateSportTypeInput, UpdateSportTypeInput } from './sport-types.schema.js';
import type { SportType } from './sport-types.types.js';

export class SportTypesRepository {
  async findAll(filters: { search?: string; active?: string }, page: number, limit: number) {
    const where: any = {};
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    if (filters.active !== undefined) {
      where.active = filters.active === 'true';
    }

    const [items, total] = await Promise.all([
      prisma.sportType.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { name: 'asc' } }),
      prisma.sportType.count({ where }),
    ]);
    return { items, total };
  }

  async findById(id: string): Promise<SportType | null> {
    return prisma.sportType.findUnique({ where: { id } });
  }

  async findByName(name: string): Promise<SportType | null> {
    return prisma.sportType.findUnique({ where: { name } });
  }

  async create(data: CreateSportTypeInput): Promise<SportType> {
    return prisma.sportType.create({ data });
  }

  async update(id: string, data: UpdateSportTypeInput): Promise<SportType> {
    return prisma.sportType.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.sportType.delete({ where: { id } });
  }
}

export const sportTypesRepository = new SportTypesRepository();
