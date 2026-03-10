import { conditionTypesRepository } from './condition-types.repository.js';
import { NotFoundError } from '../../shared/errors/NotFoundError.js';
import { ValidationError } from '../../shared/errors/ValidationError.js';
import type { CreateConditionTypeInput, UpdateConditionTypeInput, ConditionTypeFiltersInput } from './condition-types.schema.js';
import type { ConditionType } from './condition-types.types.js';

export class ConditionTypesService {
  async findAll(filters: ConditionTypeFiltersInput) {
    const { page, limit, ...rest } = filters;
    const { items, total } = await conditionTypesRepository.findAll(rest, page, limit);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string): Promise<ConditionType> {
    const item = await conditionTypesRepository.findById(id);
    if (!item) throw new NotFoundError('Tipo de condición');
    return item;
  }

  async create(data: CreateConditionTypeInput): Promise<ConditionType> {
    const existing = await conditionTypesRepository.findByKey(data.key);
    if (existing) throw new ValidationError('Ya existe un tipo de condición con ese key');
    return conditionTypesRepository.create(data);
  }

  async update(id: string, data: UpdateConditionTypeInput): Promise<ConditionType> {
    await this.findById(id);
    return conditionTypesRepository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await conditionTypesRepository.delete(id);
  }
}

export const conditionTypesService = new ConditionTypesService();
