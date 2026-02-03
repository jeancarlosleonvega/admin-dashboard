import type { FastifyInstance } from 'fastify';
import { rolesController } from './roles.controller.js';
import { authenticate } from '../../shared/middlewares/authenticate.js';
import { authorize } from '../../shared/middlewares/authorize.js';

export async function rolesRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  fastify.get('/', {
    preHandler: [authorize('roles.view')],
    handler: rolesController.findAll.bind(rolesController),
  });

  fastify.get('/:id', {
    preHandler: [authorize('roles.view')],
    handler: rolesController.findById.bind(rolesController),
  });

  fastify.post('/', {
    preHandler: [authorize('roles.manage')],
    handler: rolesController.create.bind(rolesController),
  });

  fastify.put('/:id', {
    preHandler: [authorize('roles.manage')],
    handler: rolesController.update.bind(rolesController),
  });

  fastify.delete('/:id', {
    preHandler: [authorize('roles.manage')],
    handler: rolesController.delete.bind(rolesController),
  });

  fastify.post('/bulk-delete', {
    preHandler: [authorize('roles.manage')],
    handler: rolesController.bulkDelete.bind(rolesController),
  });
}
