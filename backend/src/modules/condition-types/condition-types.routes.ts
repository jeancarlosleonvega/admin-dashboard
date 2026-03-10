import type { FastifyInstance } from 'fastify';
import { conditionTypesController } from './condition-types.controller.js';
import { authenticate } from '../../shared/middlewares/authenticate.js';
import { authorize } from '../../shared/middlewares/authorize.js';

export async function conditionTypesRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  fastify.get('/', {
    preHandler: [authorize('condition-types.view')],
    handler: conditionTypesController.findAll.bind(conditionTypesController),
  });

  fastify.get('/:id', {
    preHandler: [authorize('condition-types.view')],
    handler: conditionTypesController.findById.bind(conditionTypesController),
  });

  fastify.post('/', {
    preHandler: [authorize('condition-types.manage')],
    handler: conditionTypesController.create.bind(conditionTypesController),
  });

  fastify.put('/:id', {
    preHandler: [authorize('condition-types.manage')],
    handler: conditionTypesController.update.bind(conditionTypesController),
  });

  fastify.delete('/:id', {
    preHandler: [authorize('condition-types.manage')],
    handler: conditionTypesController.delete.bind(conditionTypesController),
  });
}
