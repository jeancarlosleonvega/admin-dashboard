import type { FastifyInstance } from 'fastify';
import { revenueController } from './revenue.controller.js';
import { authenticate } from '../../shared/middlewares/authenticate.js';
import { authorize } from '../../shared/middlewares/authorize.js';

export async function revenueRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  // Factor types
  fastify.get('/factor-types', {
    preHandler: [authorize('revenue.view')],
    handler: revenueController.findAllFactorTypes.bind(revenueController),
  });
  fastify.post('/factor-types', {
    preHandler: [authorize('revenue.manage')],
    handler: revenueController.createFactorType.bind(revenueController),
  });
  fastify.delete('/factor-types/:id', {
    preHandler: [authorize('revenue.manage')],
    handler: revenueController.deleteFactorType.bind(revenueController),
  });

  // Config por SportType
  fastify.get('/', {
    preHandler: [authorize('revenue.view')],
    handler: revenueController.findAll.bind(revenueController),
  });
  fastify.get('/:sportTypeId', {
    preHandler: [authorize('revenue.view')],
    handler: revenueController.findBySportType.bind(revenueController),
  });
  fastify.put('/:sportTypeId', {
    preHandler: [authorize('revenue.manage')],
    handler: revenueController.upsert.bind(revenueController),
  });
}
