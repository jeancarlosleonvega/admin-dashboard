import type { FastifyRequest, FastifyReply } from 'fastify';
import { slotsService } from './slots.service.js';
import { slotsQuerySchema, slotsAvailabilityQuerySchema, slotsSearchSchema } from './slots.schema.js';
import { successResponse } from '../../shared/utils/response.js';
import { ValidationError } from '../../shared/errors/ValidationError.js';
import { z } from 'zod';

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
    const userId = (request as any).user?.userId;
    const items = await slotsService.searchAvailable(parsed.data, userId);
    return reply.send(successResponse(items));
  }

  async getAgenda(request: FastifyRequest, reply: FastifyReply) {
    const parsed = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).safeParse(request.query);
    if (!parsed.success) throw new ValidationError('Parámetros inválidos', parsed.error.errors);
    const data = await slotsService.getAgenda(parsed.data.date);
    return reply.send(successResponse(data));
  }

  async getAgendaMonthAvailability(request: FastifyRequest, reply: FastifyReply) {
    const parsed = z.object({
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    }).safeParse(request.query);
    if (!parsed.success) throw new ValidationError('Parámetros inválidos', parsed.error.errors);
    const data = await slotsService.getAgendaMonthAvailability(parsed.data.startDate, parsed.data.endDate);
    return reply.send(successResponse(data));
  }
}

export const slotsController = new SlotsController();
