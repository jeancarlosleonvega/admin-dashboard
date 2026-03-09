import { additionalServicesRepository } from './additional-services.repository.js';
import { NotFoundError } from '../../shared/errors/NotFoundError.js';
import type { CreateAdditionalServiceInput, UpdateAdditionalServiceInput, AdditionalServiceFiltersInput } from './additional-services.schema.js';

export class AdditionalServicesService {
  async findAll(filters: AdditionalServiceFiltersInput) {
    const { page, limit, ...rest } = filters;
    const { items, total } = await additionalServicesRepository.findAll(rest, page, limit);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    const item = await additionalServicesRepository.findById(id);
    if (!item) throw new NotFoundError('Servicio adicional');
    return item;
  }

  async create(data: CreateAdditionalServiceInput) {
    return additionalServicesRepository.create(data);
  }

  async update(id: string, data: UpdateAdditionalServiceInput) {
    await this.findById(id);
    return additionalServicesRepository.update(id, data);
  }

  async delete(id: string) {
    await this.findById(id);
    await additionalServicesRepository.delete(id);
  }
}

export const additionalServicesService = new AdditionalServicesService();
