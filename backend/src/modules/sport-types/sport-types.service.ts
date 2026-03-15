import { sportTypesRepository } from './sport-types.repository.js';
import { NotFoundError } from '../../shared/errors/NotFoundError.js';
import { ValidationError } from '../../shared/errors/ValidationError.js';
import type { CreateSportTypeInput, UpdateSportTypeInput, SportTypeFiltersInput } from './sport-types.schema.js';
import type { SportType } from './sport-types.types.js';
import { Prisma } from '@prisma/client';

export class SportTypesService {
  async findAll(filters: SportTypeFiltersInput) {
    const { page, limit, ...rest } = filters;
    const { items, total } = await sportTypesRepository.findAll(rest, page, limit);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string): Promise<SportType> {
    const item = await sportTypesRepository.findById(id);
    if (!item) throw new NotFoundError('Tipo de deporte');
    return item;
  }

  async create(data: CreateSportTypeInput): Promise<SportType> {
    const existing = await sportTypesRepository.findByName(data.name);
    if (existing) throw new ValidationError('Ya existe un tipo de deporte con ese nombre');
    return sportTypesRepository.create(data);
  }

  async update(id: string, data: UpdateSportTypeInput): Promise<SportType> {
    await this.findById(id);
    if (data.name) {
      const existing = await sportTypesRepository.findByName(data.name);
      if (existing && existing.id !== id) throw new ValidationError('Ya existe un tipo de deporte con ese nombre');
    }
    return sportTypesRepository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    try {
      await sportTypesRepository.delete(id);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
        throw new ValidationError('No se puede eliminar: el tipo de deporte tiene registros asociados (espacios, períodos bloqueados u otros)');
      }
      throw err;
    }
  }
}

export const sportTypesService = new SportTypesService();
