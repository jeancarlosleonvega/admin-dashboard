import type { FastifyInstance } from 'fastify';
import { membershipPlansController } from './membership-plans.controller.js';
import { authenticate } from '../../shared/middlewares/authenticate.js';
import { authorize } from '../../shared/middlewares/authorize.js';

export async function membershipPlansRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  fastify.get('/', {
    preHandler: [authorize('membership-plans.view')],
    handler: membershipPlansController.findAll.bind(membershipPlansController),
  });

  fastify.get('/:id', {
    preHandler: [authorize('membership-plans.view')],
    handler: membershipPlansController.findById.bind(membershipPlansController),
  });

  fastify.post('/', {
    preHandler: [authorize('membership-plans.manage')],
    handler: membershipPlansController.create.bind(membershipPlansController),
  });

  fastify.put('/:id', {
    preHandler: [authorize('membership-plans.manage')],
    handler: membershipPlansController.update.bind(membershipPlansController),
  });

  fastify.delete('/:id', {
    preHandler: [authorize('membership-plans.manage')],
    handler: membershipPlansController.delete.bind(membershipPlansController),
  });
}
