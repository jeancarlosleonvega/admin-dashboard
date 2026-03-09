import type { FastifyRequest, FastifyReply } from 'fastify';
import { additionalServicesService } from './additional-services.service.js';
import {
  createAdditionalServiceSchema,
  updateAdditionalServiceSchema,
  additionalServiceFiltersSchema,
} from './additional-services.schema.js';
import { successResponse } from '../../shared/utils/response.js';
import { ValidationError } from '../../shared/errors/ValidationError.js';

export class AdditionalServicesController {
  async findAll(request: FastifyRequest, reply: FastifyReply) {
    const parsed = additionalServiceFiltersSchema.safeParse(request.query);
    if (!parsed.success) throw new ValidationError('Filtros inválidos', parsed.error.errors);
    const result = await additionalServicesService.findAll(parsed.data);
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
    const item = await additionalServicesService.findById(request.params.id);
    return reply.send(successResponse(item));
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const parsed = createAdditionalServiceSchema.safeParse(request.body);
    if (!parsed.success) throw new ValidationError('Validation failed', parsed.error.errors);
    const item = await additionalServicesService.create(parsed.data);
    return reply.status(201).send(successResponse(item));
  }

  async update(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const parsed = updateAdditionalServiceSchema.safeParse(request.body);
    if (!parsed.success) throw new ValidationError('Validation failed', parsed.error.errors);
    const item = await additionalServicesService.update(request.params.id, parsed.data);
    return reply.send(successResponse(item));
  }

  async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    await additionalServicesService.delete(request.params.id);
    return reply.send(successResponse({ message: 'Servicio adicional eliminado' }));
  }
}

export const additionalServicesController = new AdditionalServicesController();
