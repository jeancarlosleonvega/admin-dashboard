import type { FastifyInstance } from 'fastify';
import { userMembershipsController } from './user-memberships.controller.js';
import { authenticate } from '../../shared/middlewares/authenticate.js';
import { authorize } from '../../shared/middlewares/authorize.js';

export async function userMembershipsRoutes(fastify: FastifyInstance) {
  // Webhook público de MercadoPago (sin auth)
  fastify.post('/webhook/mercadopago', {
    handler: userMembershipsController.mpWebhook.bind(userMembershipsController),
  });

  fastify.addHook('preHandler', authenticate);

  fastify.post('/subscribe', {
    handler: userMembershipsController.subscribe.bind(userMembershipsController),
  });

  fastify.get('/my', {
    handler: userMembershipsController.findMy.bind(userMembershipsController),
  });

  fastify.get('/', {
    preHandler: [authorize('user-memberships.view')],
    handler: userMembershipsController.findAll.bind(userMembershipsController),
  });

  fastify.get('/:id', {
    preHandler: [authorize('user-memberships.view')],
    handler: userMembershipsController.findById.bind(userMembershipsController),
  });

  fastify.post('/', {
    preHandler: [authorize('user-memberships.manage')],
    handler: userMembershipsController.create.bind(userMembershipsController),
  });

  fastify.put('/:id', {
    preHandler: [authorize('user-memberships.manage')],
    handler: userMembershipsController.update.bind(userMembershipsController),
  });

  fastify.delete('/:id', {
    preHandler: [authorize('user-memberships.manage')],
    handler: userMembershipsController.delete.bind(userMembershipsController),
  });
}
