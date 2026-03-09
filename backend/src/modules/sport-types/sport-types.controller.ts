import type { FastifyRequest, FastifyReply } from 'fastify';
import { sportTypesService } from './sport-types.service.js';
import { createSportTypeSchema, updateSportTypeSchema, sportTypeFiltersSchema } from './sport-types.schema.js';
import { successResponse } from '../../shared/utils/response.js';
import { ValidationError } from '../../shared/errors/ValidationError.js';

export class SportTypesController {
  async findAll(request: FastifyRequest, reply: FastifyReply) {
    const parsed = sportTypeFiltersSchema.safeParse(request.query);
    if (!parsed.success) throw new ValidationError('Filtros inválidos', parsed.error.errors);
    const result = await sportTypesService.findAll(parsed.data);
    return reply.send(successResponse(result.items, { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages }));
  }

  async findById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const item = await sportTypesService.findById(request.params.id);
    return reply.send(successResponse(item));
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const parsed = createSportTypeSchema.safeParse(request.body);
    if (!parsed.success) throw new ValidationError('Validation failed', parsed.error.errors);
    const item = await sportTypesService.create(parsed.data);
    return reply.status(201).send(successResponse(item));
  }

  async update(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const parsed = updateSportTypeSchema.safeParse(request.body);
    if (!parsed.success) throw new ValidationError('Validation failed', parsed.error.errors);
    const item = await sportTypesService.update(request.params.id, parsed.data);
    return reply.send(successResponse(item));
  }

  async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    await sportTypesService.delete(request.params.id);
    return reply.send(successResponse({ message: 'Tipo de deporte eliminado' }));
  }
}

export const sportTypesController = new SportTypesController();
