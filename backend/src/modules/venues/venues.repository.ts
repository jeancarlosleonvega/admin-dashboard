import { prisma } from '../../infrastructure/database/client.js';
import type { CreateVenueInput, UpdateVenueInput } from './venues.schema.js';
import type { VenueWithSportType } from './venues.types.js';

const sportTypeSelect = {
  id: true,
  name: true,
  defaultIntervalMinutes: true,
  defaultPlayersPerSlot: true,
  defaultOpenTime: true,
  defaultCloseTime: true,
  defaultEnabledDays: true,
};

export class VenuesRepository {
  async findAll(filters: { search?: string; sportTypeId?: string; active?: string }, page: number, limit: number) {
    const where: any = {};
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    if (filters.sportTypeId) where.sportTypeId = filters.sportTypeId;
    if (filters.active !== undefined) where.active = filters.active === 'true';

    const [items, total] = await Promise.all([
      prisma.venue.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ sportType: { name: 'asc' } }, { name: 'asc' }],
        include: { sportType: { select: sportTypeSelect } },
      }),
      prisma.venue.count({ where }),
    ]);
    return { items, total };
  }

  async findById(id: string): Promise<VenueWithSportType | null> {
    return prisma.venue.findUnique({
      where: { id },
      include: { sportType: { select: sportTypeSelect } },
    });
  }

  async create(data: CreateVenueInput): Promise<VenueWithSportType> {
    return prisma.venue.create({
      data,
      include: { sportType: { select: sportTypeSelect } },
    });
  }

  async update(id: string, data: UpdateVenueInput): Promise<VenueWithSportType> {
    return prisma.venue.update({
      where: { id },
      data,
      include: { sportType: { select: sportTypeSelect } },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.venue.delete({ where: { id } });
  }
}

export const venuesRepository = new VenuesRepository();
