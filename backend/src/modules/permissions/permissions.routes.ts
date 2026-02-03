import type { FastifyInstance } from 'fastify';
import { permissionsController } from './permissions.controller.js';
import { authenticate } from '../../shared/middlewares/authenticate.js';
import { authorize } from '../../shared/middlewares/authorize.js';

export async function permissionsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  fastify.get('/', {
    preHandler: [authorize('roles.view')],
    handler: permissionsController.findAll.bind(permissionsController),
  });

  fastify.get('/resources', {
    preHandler: [authorize('roles.view')],
    handler: permissionsController.getResources.bind(permissionsController),
  });

  fastify.get('/:id', {
    preHandler: [authorize('roles.view')],
    handler: permissionsController.findById.bind(permissionsController),
  });

  fastify.post('/', {
    preHandler: [authorize('roles.manage')],
    handler: permissionsController.create.bind(permissionsController),
  });

  fastify.put('/:id', {
    preHandler: [authorize('roles.manage')],
    handler: permissionsController.update.bind(permissionsController),
  });

  fastify.delete('/:id', {
    preHandler: [authorize('roles.manage')],
    handler: permissionsController.delete.bind(permissionsController),
  });

  fastify.post('/bulk-delete', {
    preHandler: [authorize('roles.manage')],
    handler: permissionsController.bulkDelete.bind(permissionsController),
  });
}
