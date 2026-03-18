import { prisma } from '../../infrastructure/database/client.js';
import type { CreateVenueInput, UpdateVenueInput } from './venues.schema.js';
import type { VenueWithSportType } from './venues.types.js';

const sportTypeSelect = {
  id: true,
  name: true,
};

const venueInclude = {
  sportType: { select: sportTypeSelect },
  operatingHours: true,
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
        include: venueInclude,
      }),
      prisma.venue.count({ where }),
    ]);
    return { items, total };
  }

  async findById(id: string): Promise<VenueWithSportType | null> {
    return prisma.venue.findUnique({
      where: { id },
      include: venueInclude,
    }) as any;
  }

  async create(data: CreateVenueInput): Promise<VenueWithSportType> {
    const { operatingHours, ...venueData } = data;
    const venue = await prisma.venue.create({
      data: venueData,
      include: venueInclude,
    });

    if (operatingHours && operatingHours.length > 0) {
      await prisma.venueOperatingHours.createMany({
        data: operatingHours.map((oh) => ({
          venueId: venue.id,
          daysOfWeek: oh.daysOfWeek,
          openTime: oh.openTime,
          closeTime: oh.closeTime,
        })),
      });
    }

    return prisma.venue.findUnique({ where: { id: venue.id }, include: venueInclude }) as any;
  }

  async update(id: string, data: UpdateVenueInput): Promise<VenueWithSportType> {
    const { operatingHours, ...venueData } = data;
    await prisma.venue.update({
      where: { id },
      data: venueData,
    });

    if (operatingHours !== undefined) {
      await prisma.venueOperatingHours.deleteMany({ where: { venueId: id } });
      if (operatingHours.length > 0) {
        await prisma.venueOperatingHours.createMany({
          data: operatingHours.map((oh) => ({
            venueId: id,
            daysOfWeek: oh.daysOfWeek,
            openTime: oh.openTime,
            closeTime: oh.closeTime,
          })),
        });
      }
    }

    return prisma.venue.findUnique({ where: { id }, include: venueInclude }) as any;
  }

  async delete(id: string): Promise<void> {
    await prisma.venue.delete({ where: { id } });
  }
}

export const venuesRepository = new VenuesRepository();
