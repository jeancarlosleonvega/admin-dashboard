import type { FastifyRequest, FastifyReply } from 'fastify';
import { venueSchedulesService } from './venue-schedules.service.js';
import {
  createVenueScheduleSchema,
  updateVenueScheduleSchema,
  venueScheduleFiltersSchema,
  generateSlotsSchema,
} from './venue-schedules.schema.js';
import { successResponse } from '../../shared/utils/response.js';
import { ValidationError } from '../../shared/errors/ValidationError.js';

export class VenueSchedulesController {
  async findAll(request: FastifyRequest, reply: FastifyReply) {
    const parsed = venueScheduleFiltersSchema.safeParse(request.query);
    if (!parsed.success) throw new ValidationError('Filtros inválidos', parsed.error.errors);
    const result = await venueSchedulesService.findAll(parsed.data);
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
    const item = await venueSchedulesService.findById(request.params.id);
    return reply.send(successResponse(item));
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const parsed = createVenueScheduleSchema.safeParse(request.body);
    if (!parsed.success) throw new ValidationError('Validation failed', parsed.error.errors);
    const item = await venueSchedulesService.create(parsed.data);
    return reply.status(201).send(successResponse(item));
  }

  async update(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const parsed = updateVenueScheduleSchema.safeParse(request.body);
    if (!parsed.success) throw new ValidationError('Validation failed', parsed.error.errors);
    const item = await venueSchedulesService.update(request.params.id, parsed.data);
    return reply.send(successResponse(item));
  }

  async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    await venueSchedulesService.delete(request.params.id);
    return reply.send(successResponse({ message: 'Schedule eliminado' }));
  }

  async generateSlots(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const parsed = generateSlotsSchema.safeParse(request.body);
    if (!parsed.success) throw new ValidationError('Validation failed', parsed.error.errors);
    const item = await venueSchedulesService.generateSlotsManually(request.params.id, parsed.data.until);
    return reply.send(successResponse(item));
  }
}

export const venueSchedulesController = new VenueSchedulesController();
