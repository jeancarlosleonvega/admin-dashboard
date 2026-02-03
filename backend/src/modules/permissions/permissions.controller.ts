import type { FastifyRequest, FastifyReply } from 'fastify';
import { permissionsService } from './permissions.service.js';
import { createPermissionSchema, updatePermissionSchema, permissionFiltersSchema, bulkDeletePermissionsSchema } from './permissions.schema.js';
import { successResponse } from '../../shared/utils/response.js';
import { ValidationError } from '../../shared/errors/ValidationError.js';

export class PermissionsController {
  async findAll(request: FastifyRequest, reply: FastifyReply) {
    const parsed = permissionFiltersSchema.safeParse(request.query);
    if (!parsed.success) {
      throw new ValidationError('Invalid filters', parsed.error.errors);
    }

    const result = await permissionsService.findAll(parsed.data);
    return reply.send(
      successResponse(result.permissions, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      })
    );
  }

  async findById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const permission = await permissionsService.findById(request.params.id);
    return reply.send(successResponse(permission));
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const parsed = createPermissionSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new ValidationError('Validation failed', parsed.error.errors);
    }

    const permission = await permissionsService.create(parsed.data);
    return reply.status(201).send(successResponse(permission));
  }

  async update(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const parsed = updatePermissionSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new ValidationError('Validation failed', parsed.error.errors);
    }

    const permission = await permissionsService.update(request.params.id, parsed.data);
    return reply.send(successResponse(permission));
  }

  async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    await permissionsService.delete(request.params.id);
    return reply.send(successResponse({ message: 'Permission deleted successfully' }));
  }

  async bulkDelete(request: FastifyRequest, reply: FastifyReply) {
    const parsed = bulkDeletePermissionsSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new ValidationError('Validation failed', parsed.error.errors);
    }

    const count = await permissionsService.bulkDelete(parsed.data.ids);
    return reply.send(successResponse({ message: `${count} permissions deleted successfully`, count }));
  }

  async getResources(request: FastifyRequest, reply: FastifyReply) {
    const resources = await permissionsService.getResources();
    return reply.send(successResponse(resources));
  }
}

export const permissionsController = new PermissionsController();
