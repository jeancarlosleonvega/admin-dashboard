import { prisma } from '../../infrastructure/database/client.js';
import type { SlotsSearchInput } from './slots.schema.js';

export class SlotsRepository {
  async findByVenueAndDate(venueId: string, date: string) {
    const dateObj = new Date(date + 'T00:00:00.000Z');
    return prisma.slot.findMany({
      where: {
        venueId,
        date: dateObj,
        status: 'AVAILABLE',
      },
      orderBy: { startTime: 'asc' },
      select: {
        id: true,
        venueId: true,
        date: true,
        startTime: true,
        endTime: true,
        status: true,
        venue: {
          select: {
            id: true,
            name: true,
            sportType: { select: { id: true, name: true } },
          },
        },
      },
    });
  }

  async searchAvailable(input: SlotsSearchInput) {
    const start = new Date(input.startDate + 'T00:00:00.000Z');
    const end = new Date(input.endDate + 'T00:00:00.000Z');
    return prisma.slot.findMany({
      where: {
        date: { gte: start, lte: end },
        status: 'AVAILABLE',
        ...(input.venueId && { venueId: input.venueId }),
        ...(input.startTime && { startTime: { gte: input.startTime } }),
        ...(input.endTime && { endTime: { lte: input.endTime } }),
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }, { venue: { name: 'asc' } }],
      select: {
        id: true,
        venueId: true,
        date: true,
        startTime: true,
        endTime: true,
        status: true,
        venue: {
          select: {
            id: true,
            name: true,
            playersPerSlot: true,
            sportType: { select: { id: true, name: true, defaultPlayersPerSlot: true } },
          },
        },
      },
    });
  }

  async findAvailabilityByVenueAndRange(venueId: string, startDate: string, endDate: string) {
    const start = new Date(startDate + 'T00:00:00.000Z');
    const end = new Date(endDate + 'T00:00:00.000Z');

    const slots = await prisma.slot.groupBy({
      by: ['date'],
      where: {
        venueId,
        date: { gte: start, lte: end },
        status: 'AVAILABLE',
      },
      _count: { id: true },
      orderBy: { date: 'asc' },
    });

    return slots.map((s) => ({
      date: s.date.toISOString().split('T')[0],
      availableSlots: s._count.id,
    }));
  }
}

export const slotsRepository = new SlotsRepository();
