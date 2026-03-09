import type { FastifyInstance } from 'fastify';
import { blockedPeriodsController } from './blocked-periods.controller.js';
import { authenticate } from '../../shared/middlewares/authenticate.js';
import { authorize } from '../../shared/middlewares/authorize.js';

export async function blockedPeriodsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  fastify.get('/', {
    preHandler: [authorize('blocked-periods.view')],
    handler: blockedPeriodsController.findAll.bind(blockedPeriodsController),
  });

  fastify.get('/:id', {
    preHandler: [authorize('blocked-periods.view')],
    handler: blockedPeriodsController.findById.bind(blockedPeriodsController),
  });

  fastify.post('/', {
    preHandler: [authorize('blocked-periods.manage')],
    handler: blockedPeriodsController.create.bind(blockedPeriodsController),
  });

  fastify.put('/:id', {
    preHandler: [authorize('blocked-periods.manage')],
    handler: blockedPeriodsController.update.bind(blockedPeriodsController),
  });

  fastify.delete('/:id', {
    preHandler: [authorize('blocked-periods.manage')],
    handler: blockedPeriodsController.delete.bind(blockedPeriodsController),
  });
}
