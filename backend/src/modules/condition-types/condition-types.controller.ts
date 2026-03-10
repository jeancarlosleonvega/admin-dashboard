import type { FastifyRequest, FastifyReply } from 'fastify';
import { conditionTypesService } from './condition-types.service.js';
import { createConditionTypeSchema, updateConditionTypeSchema, conditionTypeFiltersSchema } from './condition-types.schema.js';
import { successResponse } from '../../shared/utils/response.js';
import { ValidationError } from '../../shared/errors/ValidationError.js';

export class ConditionTypesController {
  async findAll(request: FastifyRequest, reply: FastifyReply) {
    const parsed = conditionTypeFiltersSchema.safeParse(request.query);
    if (!parsed.success) throw new ValidationError('Filtros inválidos', parsed.error.errors);
    const result = await conditionTypesService.findAll(parsed.data);
    return reply.send(successResponse(result.items, { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages }));
  }

  async findById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const item = await conditionTypesService.findById(request.params.id);
    return reply.send(successResponse(item));
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const parsed = createConditionTypeSchema.safeParse(request.body);
    if (!parsed.success) throw new ValidationError('Validation failed', parsed.error.errors);
    const item = await conditionTypesService.create(parsed.data);
    return reply.status(201).send(successResponse(item));
  }

  async update(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const parsed = updateConditionTypeSchema.safeParse(request.body);
    if (!parsed.success) throw new ValidationError('Validation failed', parsed.error.errors);
    const item = await conditionTypesService.update(request.params.id, parsed.data);
    return reply.send(successResponse(item));
  }

  async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    await conditionTypesService.delete(request.params.id);
    return reply.send(successResponse({ message: 'Tipo de condición eliminado' }));
  }
}

export const conditionTypesController = new ConditionTypesController();
