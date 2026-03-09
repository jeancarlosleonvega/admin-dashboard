import { venuesRepository } from './venues.repository.js';
import { sportTypesRepository } from '../sport-types/sport-types.repository.js';
import { NotFoundError } from '../../shared/errors/NotFoundError.js';
import { ValidationError } from '../../shared/errors/ValidationError.js';
import type { CreateVenueInput, UpdateVenueInput, VenueFiltersInput } from './venues.schema.js';
import type { VenueWithSportType, ResolvedVenue } from './venues.types.js';

function resolveVenue(venue: VenueWithSportType): ResolvedVenue {
  const st = venue.sportType;
  return {
    ...venue,
    intervalMinutes: venue.intervalMinutes ?? st.defaultIntervalMinutes,
    playersPerSlot: venue.playersPerSlot ?? st.defaultPlayersPerSlot,
    openTime: venue.openTime ?? st.defaultOpenTime,
    closeTime: venue.closeTime ?? st.defaultCloseTime,
    enabledDays: venue.enabledDays.length > 0 ? venue.enabledDays : st.defaultEnabledDays,
  };
}

export class VenuesService {
  async findAll(filters: VenueFiltersInput) {
    const { page, limit, ...rest } = filters;
    const { items, total } = await venuesRepository.findAll(rest, page, limit);
    return {
      items: items.map(resolveVenue),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<ResolvedVenue> {
    const item = await venuesRepository.findById(id);
    if (!item) throw new NotFoundError('Espacio');
    return resolveVenue(item);
  }

  async create(data: CreateVenueInput): Promise<ResolvedVenue> {
    const sportType = await sportTypesRepository.findById(data.sportTypeId);
    if (!sportType) throw new ValidationError('Tipo de deporte no encontrado');
    const item = await venuesRepository.create(data);
    return resolveVenue(item);
  }

  async update(id: string, data: UpdateVenueInput): Promise<ResolvedVenue> {
    await this.findById(id);
    if (data.sportTypeId) {
      const sportType = await sportTypesRepository.findById(data.sportTypeId);
      if (!sportType) throw new ValidationError('Tipo de deporte no encontrado');
    }
    const item = await venuesRepository.update(id, data);
    return resolveVenue(item);
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await venuesRepository.delete(id);
  }
}

export const venuesService = new VenuesService();
