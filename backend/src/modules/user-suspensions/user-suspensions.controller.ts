import type { FastifyRequest, FastifyReply } from 'fastify';
import { userSuspensionsService } from './user-suspensions.service.js';
import { createSuspensionSchema, suspensionFiltersSchema } from './user-suspensions.schema.js';
import { successResponse } from '../../shared/utils/response.js';
import { ValidationError } from '../../shared/errors/ValidationError.js';

export class UserSuspensionsController {
  async findByUser(request: FastifyRequest, reply: FastifyReply) {
    const parsed = suspensionFiltersSchema.safeParse(request.query);
    if (!parsed.success) throw new ValidationError('Filtros inválidos', parsed.error.errors);
    const items = await userSuspensionsService.findByUser(parsed.data.userId!);
    return reply.send(successResponse(items));
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const adminId = (request as any).user.userId;
    const parsed = createSuspensionSchema.safeParse(request.body);
    if (!parsed.success) throw new ValidationError('Datos inválidos', parsed.error.errors);
    const item = await userSuspensionsService.create(adminId, parsed.data);
    return reply.status(201).send(successResponse(item));
  }

  async lift(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const adminId = (request as any).user.userId;
    const item = await userSuspensionsService.lift(request.params.id, adminId);
    return reply.send(successResponse(item));
  }
}

export const userSuspensionsController = new UserSuspensionsController();
