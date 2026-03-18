import type { FastifyInstance } from 'fastify';
import { configController } from './config.controller.js';

export async function configRoutes(fastify: FastifyInstance) {
  fastify.get('/', { handler: configController.findAll.bind(configController) });
  fastify.get('/:key', { handler: configController.findByKey.bind(configController) });
  fastify.put('/', { handler: configController.upsert.bind(configController) });
  fastify.put('/bulk', { handler: configController.upsertMany.bind(configController) });
  fastify.delete('/:key', { handler: configController.delete.bind(configController) });
}
