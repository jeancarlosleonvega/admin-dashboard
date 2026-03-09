import type { FastifyInstance } from 'fastify';
import { venuesController } from './venues.controller.js';
import { authenticate } from '../../shared/middlewares/authenticate.js';
import { authorize } from '../../shared/middlewares/authorize.js';

export async function venuesRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  fastify.get('/', {
    preHandler: [authorize('venues.view')],
    handler: venuesController.findAll.bind(venuesController),
  });

  fastify.get('/:id', {
    preHandler: [authorize('venues.view')],
    handler: venuesController.findById.bind(venuesController),
  });

  fastify.post('/', {
    preHandler: [authorize('venues.manage')],
    handler: venuesController.create.bind(venuesController),
  });

  fastify.put('/:id', {
    preHandler: [authorize('venues.manage')],
    handler: venuesController.update.bind(venuesController),
  });

  fastify.delete('/:id', {
    preHandler: [authorize('venues.manage')],
    handler: venuesController.delete.bind(venuesController),
  });
}
