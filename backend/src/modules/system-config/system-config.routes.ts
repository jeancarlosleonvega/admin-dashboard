import type { FastifyInstance } from 'fastify';
import { systemConfigController } from './system-config.controller.js';
import { authenticate } from '../../shared/middlewares/authenticate.js';
import { authorize } from '../../shared/middlewares/authorize.js';

export async function systemConfigRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  fastify.get('/', {
    preHandler: [authorize('system-config.view')],
    handler: systemConfigController.findAll.bind(systemConfigController),
  });

  fastify.get('/:key', {
    preHandler: [authorize('system-config.view')],
    handler: systemConfigController.findByKey.bind(systemConfigController),
  });

  fastify.put('/', {
    preHandler: [authorize('system-config.manage')],
    handler: systemConfigController.upsert.bind(systemConfigController),
  });

  fastify.delete('/:key', {
    preHandler: [authorize('system-config.manage')],
    handler: systemConfigController.delete.bind(systemConfigController),
  });
}
