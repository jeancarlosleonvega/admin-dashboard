import { slotsRepository } from './slots.repository.js';
import type { SlotsQueryInput, SlotsAvailabilityQueryInput, SlotsSearchInput } from './slots.schema.js';

export class SlotsService {
  async findByVenueAndDate(data: SlotsQueryInput) {
    return slotsRepository.findByVenueAndDate(data.venueId, data.date);
  }

  async getAvailability(data: SlotsAvailabilityQueryInput) {
    return slotsRepository.findAvailabilityByVenueAndRange(data.venueId, data.startDate, data.endDate);
  }

  async searchAvailable(data: SlotsSearchInput) {
    return slotsRepository.searchAvailable(data);
  }
}

export const slotsService = new SlotsService();
