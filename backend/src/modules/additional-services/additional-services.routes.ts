import type { FastifyInstance } from 'fastify';
import { additionalServicesController } from './additional-services.controller.js';
import { authenticate } from '../../shared/middlewares/authenticate.js';
import { authorize } from '../../shared/middlewares/authorize.js';

export async function additionalServicesRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  fastify.get('/', {
    preHandler: [authorize('additional-services.view')],
    handler: additionalServicesController.findAll.bind(additionalServicesController),
  });

  fastify.get('/:id', {
    preHandler: [authorize('additional-services.view')],
    handler: additionalServicesController.findById.bind(additionalServicesController),
  });

  fastify.post('/', {
    preHandler: [authorize('additional-services.manage')],
    handler: additionalServicesController.create.bind(additionalServicesController),
  });

  fastify.put('/:id', {
    preHandler: [authorize('additional-services.manage')],
    handler: additionalServicesController.update.bind(additionalServicesController),
  });

  fastify.delete('/:id', {
    preHandler: [authorize('additional-services.manage')],
    handler: additionalServicesController.delete.bind(additionalServicesController),
  });
}
