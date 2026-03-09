import type { FastifyRequest, FastifyReply } from 'fastify';
import { venuesService } from './venues.service.js';
import { createVenueSchema, updateVenueSchema, venueFiltersSchema } from './venues.schema.js';
import { successResponse } from '../../shared/utils/response.js';
import { ValidationError } from '../../shared/errors/ValidationError.js';

export class VenuesController {
  async findAll(request: FastifyRequest, reply: FastifyReply) {
    const parsed = venueFiltersSchema.safeParse(request.query);
    if (!parsed.success) throw new ValidationError('Filtros inválidos', parsed.error.errors);
    const result = await venuesService.findAll(parsed.data);
    return reply.send(successResponse(result.items, { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages }));
  }

  async findById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const item = await venuesService.findById(request.params.id);
    return reply.send(successResponse(item));
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const parsed = createVenueSchema.safeParse(request.body);
    if (!parsed.success) throw new ValidationError('Validation failed', parsed.error.errors);
    const item = await venuesService.create(parsed.data);
    return reply.status(201).send(successResponse(item));
  }

  async update(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const parsed = updateVenueSchema.safeParse(request.body);
    if (!parsed.success) throw new ValidationError('Validation failed', parsed.error.errors);
    const item = await venuesService.update(request.params.id, parsed.data);
    return reply.send(successResponse(item));
  }

  async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    await venuesService.delete(request.params.id);
    return reply.send(successResponse({ message: 'Espacio eliminado' }));
  }
}

export const venuesController = new VenuesController();
