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
  async findByVenueAndDate(data: SlotsQueryInput, userId?: string) {
    const userProfile = userId ? await buildUserProfile(userId) : undefined;
    return slotsRepository.findByVenueAndDate(data.venueId, data.date, userProfile);
  }

  async getAvailability(data: SlotsAvailabilityQueryInput) {
    return slotsRepository.findAvailabilityByVenueAndRange(data.venueId, data.startDate, data.endDate);
  }

  async searchAvailable(data: SlotsSearchInput, userId?: string) {
    const userProfile = userId ? await buildUserProfile(userId) : undefined;
    return slotsRepository.searchAvailable(data, userProfile);
  }
}

export const slotsService = new SlotsService();
