import type { FastifyRequest, FastifyReply } from 'fastify';
import { blockedPeriodsService } from './blocked-periods.service.js';
import {
  createBlockedPeriodSchema,
  updateBlockedPeriodSchema,
  blockedPeriodFiltersSchema,
} from './blocked-periods.schema.js';
import { successResponse } from '../../shared/utils/response.js';
import { ValidationError } from '../../shared/errors/ValidationError.js';

export class BlockedPeriodsController {
  async findAll(request: FastifyRequest, reply: FastifyReply) {
    const parsed = blockedPeriodFiltersSchema.safeParse(request.query);
    if (!parsed.success) throw new ValidationError('Filtros inválidos', parsed.error.errors);
    const result = await blockedPeriodsService.findAll(parsed.data);
    return reply.send(
      successResponse(result.items, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      })
    );
  }

  async findById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const item = await blockedPeriodsService.findById(request.params.id);
    return reply.send(successResponse(item));
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const parsed = createBlockedPeriodSchema.safeParse(request.body);
    if (!parsed.success) throw new ValidationError('Validation failed', parsed.error.errors);
    const item = await blockedPeriodsService.create(parsed.data);
    return reply.status(201).send(successResponse(item));
  }

  async update(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const parsed = updateBlockedPeriodSchema.safeParse(request.body);
    if (!parsed.success) throw new ValidationError('Validation failed', parsed.error.errors);
    const item = await blockedPeriodsService.update(request.params.id, parsed.data);
    return reply.send(successResponse(item));
  }

  async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    await blockedPeriodsService.delete(request.params.id);
    return reply.send(successResponse({ message: 'Período bloqueado eliminado' }));
  }
}

export const blockedPeriodsController = new BlockedPeriodsController();
