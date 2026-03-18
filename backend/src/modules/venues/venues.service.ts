import { venuesRepository } from './venues.repository.js';
import { sportTypesRepository } from '../sport-types/sport-types.repository.js';
import { NotFoundError } from '../../shared/errors/NotFoundError.js';
import { ValidationError } from '../../shared/errors/ValidationError.js';
import { broadcast } from '../../shared/utils/wsBroadcast.js';
import type { CreateVenueInput, UpdateVenueInput, VenueFiltersInput } from './venues.schema.js';
import type { VenueWithSportType } from './venues.types.js';

export class VenuesService {
  async findAll(filters: VenueFiltersInput) {
    const { page, limit, ...rest } = filters;
    const { items, total } = await venuesRepository.findAll(rest, page, limit);
    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<VenueWithSportType> {
    const item = await venuesRepository.findById(id);
    if (!item) throw new NotFoundError('Espacio');
    return item;
  }

  async create(data: CreateVenueInput): Promise<VenueWithSportType> {
    const sportType = await sportTypesRepository.findById(data.sportTypeId);
    if (!sportType) throw new ValidationError('Tipo de deporte no encontrado');
    const item = await venuesRepository.create(data);
    return item;
  }

  async update(id: string, data: UpdateVenueInput): Promise<VenueWithSportType> {
    await this.findById(id);
    if (data.sportTypeId) {
      const sportType = await sportTypesRepository.findById(data.sportTypeId);
      if (!sportType) throw new ValidationError('Tipo de deporte no encontrado');
    }
    const item = await venuesRepository.update(id, data);
    broadcast('slots:invalidate', { source: 'El precio cambió' });
    return item;
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await venuesRepository.delete(id);
  }
}

export const venuesService = new VenuesService();
