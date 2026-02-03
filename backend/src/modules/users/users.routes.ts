import type { FastifyInstance } from 'fastify';
import { usersController } from './users.controller.js';
import { authenticate } from '../../shared/middlewares/authenticate.js';
import { authorize } from '../../shared/middlewares/authorize.js';

export async function usersRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', authenticate);

  fastify.get('/', {
    preHandler: [authorize('users.view')],
    handler: usersController.findAll.bind(usersController),
  });

  fastify.get('/:id', {
    preHandler: [authorize('users.view')],
    handler: usersController.findById.bind(usersController),
  });

  fastify.post('/', {
    preHandler: [authorize('users.create')],
    handler: usersController.create.bind(usersController),
  });

  fastify.put('/:id', {
    preHandler: [authorize('users.edit')],
    handler: usersController.update.bind(usersController),
  });

  fastify.delete('/:id', {
    preHandler: [authorize('users.delete')],
    handler: usersController.delete.bind(usersController),
  });

  fastify.post('/bulk-delete', {
    preHandler: [authorize('users.delete')],
    handler: usersController.bulkDelete.bind(usersController),
  });
}
