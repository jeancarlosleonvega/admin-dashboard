import type { FastifyRequest, FastifyReply } from 'fastify';
import { slotsService } from './slots.service.js';
import { slotsQuerySchema, slotsAvailabilityQuerySchema, slotsSearchSchema } from './slots.schema.js';
import { successResponse } from '../../shared/utils/response.js';
import { ValidationError } from '../../shared/errors/ValidationError.js';

export class SlotsController {
  async findByVenueAndDate(request: FastifyRequest, reply: FastifyReply) {
    const parsed = slotsQuerySchema.safeParse(request.query);
    if (!parsed.success) throw new ValidationError('Parámetros inválidos', parsed.error.errors);
    const items = await slotsService.findByVenueAndDate(parsed.data);
    return reply.send(successResponse(items));
  }

  async getAvailability(request: FastifyRequest, reply: FastifyReply) {
    const parsed = slotsAvailabilityQuerySchema.safeParse(request.query);
    if (!parsed.success) throw new ValidationError('Parámetros inválidos', parsed.error.errors);
    const items = await slotsService.getAvailability(parsed.data);
    return reply.send(successResponse(items));
  }

  async search(request: FastifyRequest, reply: FastifyReply) {
    const parsed = slotsSearchSchema.safeParse(request.query);
    if (!parsed.success) throw new ValidationError('Parámetros inválidos', parsed.error.errors);
    const userId = (request as any).user?.id;
    const items = await slotsService.searchAvailable(parsed.data, userId);
    return reply.send(successResponse(items));
  }
}

export const slotsController = new SlotsController();
