import type { FastifyInstance } from 'fastify';
import { sportTypesController } from './sport-types.controller.js';
import { authenticate } from '../../shared/middlewares/authenticate.js';
import { authorize } from '../../shared/middlewares/authorize.js';

export async function sportTypesRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  fastify.get('/', {
    preHandler: [authorize('sport-types.view')],
    handler: sportTypesController.findAll.bind(sportTypesController),
  });

  fastify.get('/:id', {
    preHandler: [authorize('sport-types.view')],
    handler: sportTypesController.findById.bind(sportTypesController),
  });

  fastify.post('/', {
    preHandler: [authorize('sport-types.manage')],
    handler: sportTypesController.create.bind(sportTypesController),
  });

  fastify.put('/:id', {
    preHandler: [authorize('sport-types.manage')],
    handler: sportTypesController.update.bind(sportTypesController),
  });

  fastify.delete('/:id', {
    preHandler: [authorize('sport-types.manage')],
    handler: sportTypesController.delete.bind(sportTypesController),
  });
}
