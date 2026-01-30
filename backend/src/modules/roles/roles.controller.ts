import type { FastifyRequest, FastifyReply } from 'fastify';
import { rolesService } from './roles.service.js';
import { createRoleSchema, updateRoleSchema, roleFiltersSchema } from './roles.schema.js';
import { successResponse } from '../../shared/utils/response.js';
import { ValidationError } from '../../shared/errors/ValidationError.js';

export class RolesController {
  async findAll(request: FastifyRequest, reply: FastifyReply) {
    const parsed = roleFiltersSchema.safeParse(request.query);
    if (!parsed.success) {
      throw new ValidationError('Invalid filters', parsed.error.errors);
    }

    const result = await rolesService.findAll(parsed.data);
    return reply.send(
      successResponse(result.roles, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      })
    );
  }

  async findById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const role = await rolesService.findById(request.params.id);
    return reply.send(successResponse(role));
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const parsed = createRoleSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new ValidationError('Validation failed', parsed.error.errors);
    }

    const role = await rolesService.create(parsed.data);
    return reply.status(201).send(successResponse(role));
  }

  async update(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const parsed = updateRoleSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new ValidationError('Validation failed', parsed.error.errors);
    }

    const role = await rolesService.update(request.params.id, parsed.data);
    return reply.send(successResponse(role));
  }

  async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    await rolesService.delete(request.params.id);
    return reply.send(successResponse({ message: 'Role deleted successfully' }));
  }
}

export const rolesController = new RolesController();
