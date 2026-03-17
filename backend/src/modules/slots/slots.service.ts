import { slotsRepository } from './slots.repository.js';
import { prisma } from '../../infrastructure/database/client.js';
import type { SlotsQueryInput, SlotsAvailabilityQueryInput, SlotsSearchInput } from './slots.schema.js';

async function buildUserProfile(userId: string) {
  const [user, activeMembership] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { sex: true, birthDate: true, handicap: true },
    }),
    prisma.userMembership.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        OR: [{ endDate: null }, { endDate: { gt: new Date() } }],
      },
      select: { membershipPlanId: true },
    }),
  ]);

  return {
    membershipPlanId: activeMembership?.membershipPlanId ?? null,
    sex: user?.sex ?? null,
    birthDate: user?.birthDate ?? null,
    handicap: user?.handicap ?? null,
  };
}

export class SlotsService {
  async findByVenueAndDate(data: SlotsQueryInput) {
    return slotsRepository.findByVenueAndDate(data.venueId, data.date, data.scheduleId);
  }

  async getAvailability(data: SlotsAvailabilityQueryInput) {
    return slotsRepository.findAvailabilityByVenueAndRange(data.venueId, data.startDate, data.endDate, data.scheduleId, data.openTime, data.closeTime);
  }

  async searchAvailable(data: SlotsSearchInput, userId?: string) {
    const userProfile = userId ? await buildUserProfile(userId) : undefined;
    return slotsRepository.searchAvailable(data, userProfile);
  }

  async getAgenda(date: string) {
    return slotsRepository.getAgenda(date);
  }

  async getAgendaMonthAvailability(startDate: string, endDate: string) {
    return slotsRepository.getAgendaMonthAvailability(startDate, endDate);
  }
}

export const slotsService = new SlotsService();
