import { prisma } from '../../infrastructure/database/client.js';

const bookingInclude = {
  slot: {
    include: {
      venue: {
        include: {
          sportType: true,
        },
      },
    },
  },
  payment: true,
  bookingServices: {
    include: {
      service: true,
    },
  },
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  },
};

export class BookingsRepository {
  async findMy(userId: string, filters: { status?: string; page: number; limit: number }) {
    const where: any = { userId };
    if (filters.status) where.status = filters.status;

    const [items, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        orderBy: { createdAt: 'desc' },
        include: bookingInclude,
      }),
      prisma.booking.count({ where }),
    ]);

    return { items, total };
  }

  async findAll(filters: {
    userId?: string;
    venueId?: string;
    status?: string;
    date?: string;
    page: number;
    limit: number;
  }) {
    const where: any = {};
    if (filters.userId) where.userId = filters.userId;
    if (filters.status) where.status = filters.status;
    if (filters.venueId) where.slot = { venueId: filters.venueId };
    if (filters.date) {
      const dateObj = new Date(filters.date + 'T00:00:00.000Z');
      where.slot = { ...(where.slot ?? {}), date: dateObj };
    }

    const [items, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        orderBy: { createdAt: 'desc' },
        include: bookingInclude,
      }),
      prisma.booking.count({ where }),
    ]);

    return { items, total };
  }

  async findById(id: string) {
    return prisma.booking.findUnique({
      where: { id },
      include: bookingInclude,
    });
  }
}

export const bookingsRepository = new BookingsRepository();
