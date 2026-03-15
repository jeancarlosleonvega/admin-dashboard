import type { FastifyRequest, FastifyReply } from 'fastify';
import { revenueService } from './revenue.service.js';
import { upsertRevenueConfigSchema, createFactorTypeSchema, updateFactorTypeSchema } from './revenue.schema.js';
import { successResponse } from '../../shared/utils/response.js';
import { ValidationError } from '../../shared/errors/ValidationError.js';

export class RevenueController {
  async findAllFactorTypes(_req: FastifyRequest, reply: FastifyReply) {
    return reply.send(successResponse(await revenueService.findAllFactorTypes()));
  }

  async createFactorType(request: FastifyRequest, reply: FastifyReply) {
    const parsed = createFactorTypeSchema.safeParse(request.body);
    if (!parsed.success) throw new ValidationError('Validación fallida', parsed.error.errors);
    return reply.send(successResponse(await revenueService.createFactorType(parsed.data)));
  }

  async updateFactorType(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const parsed = updateFactorTypeSchema.safeParse(request.body);
    if (!parsed.success) throw new ValidationError('Validación fallida', parsed.error.errors);
    return reply.send(successResponse(await revenueService.updateFactorType(request.params.id, parsed.data)));
  }

  async deleteFactorType(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    await revenueService.deleteFactorType(request.params.id);
    return reply.send(successResponse({ deleted: true }));
  }

  async findAll(_req: FastifyRequest, reply: FastifyReply) {
    return reply.send(successResponse(await revenueService.findAll()));
  }

  async findBySportType(request: FastifyRequest<{ Params: { sportTypeId: string } }>, reply: FastifyReply) {
    return reply.send(successResponse(await revenueService.findBySportType(request.params.sportTypeId)));
  }

  async upsert(request: FastifyRequest<{ Params: { sportTypeId: string } }>, reply: FastifyReply) {
    const parsed = upsertRevenueConfigSchema.safeParse(request.body);
    if (!parsed.success) throw new ValidationError('Validación fallida', parsed.error.errors);
    return reply.send(successResponse(await revenueService.upsert(request.params.sportTypeId, parsed.data)));
  }
}

export const revenueController = new RevenueController();
