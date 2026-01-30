import type { FastifyRequest, FastifyReply } from 'fastify';
import { usersService } from './users.service.js';
import { createUserSchema, updateUserSchema, userFiltersSchema } from './users.schema.js';
import { successResponse } from '../../shared/utils/response.js';
import { ValidationError } from '../../shared/errors/ValidationError.js';

export class UsersController {
  async findAll(request: FastifyRequest, reply: FastifyReply) {
    const parsed = userFiltersSchema.safeParse(request.query);
    if (!parsed.success) {
      throw new ValidationError('Invalid filters', parsed.error.errors);
    }

    const result = await usersService.findAll(parsed.data);
    return reply.send(
      successResponse(result.users, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      })
    );
  }

  async findById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const user = await usersService.findById(request.params.id);
    return reply.send(successResponse(user));
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const parsed = createUserSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new ValidationError('Validation failed', parsed.error.errors);
    }

    const user = await usersService.create(parsed.data);
    return reply.status(201).send(successResponse(user));
  }

  async update(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const parsed = updateUserSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new ValidationError('Validation failed', parsed.error.errors);
    }

    const user = await usersService.update(request.params.id, parsed.data);
    return reply.send(successResponse(user));
  }

  async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    await usersService.delete(request.params.id);
    return reply.send(successResponse({ message: 'User deleted successfully' }));
  }
}

export const usersController = new UsersController();
