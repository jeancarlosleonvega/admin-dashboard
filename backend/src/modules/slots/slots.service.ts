import { slotsRepository } from './slots.repository.js';
import { prisma } from '../../infrastructure/database/client.js';
import type { SlotsQueryInput, SlotsAvailabilityQueryInput, SlotsSearchInput } from './slots.schema.js';

export class SlotsService {
  async findByVenueAndDate(data: SlotsQueryInput) {
    return slotsRepository.findByVenueAndDate(data.venueId, data.date);
  }

  async getAvailability(data: SlotsAvailabilityQueryInput) {
    return slotsRepository.findAvailabilityByVenueAndRange(data.venueId, data.startDate, data.endDate);
  }

  async searchAvailable(data: SlotsSearchInput, userId?: string) {
    let userProfile;
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { sex: true, birthDate: true, handicap: true },
      });

      const activeMembership = await prisma.userMembership.findFirst({
        where: {
          userId,
          status: 'ACTIVE',
          OR: [
            { endDate: null },
            { endDate: { gt: new Date() } },
          ],
        },
        select: { membershipPlanId: true },
      });

      userProfile = {
        membershipPlanId: activeMembership?.membershipPlanId ?? null,
        sex: user?.sex ?? null,
        birthDate: user?.birthDate ?? null,
        handicap: user?.handicap ?? null,
      };
    }

    return slotsRepository.searchAvailable(data, userProfile);
  }
}

export const slotsService = new SlotsService();
