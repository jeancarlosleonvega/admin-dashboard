import type { FastifyInstance } from 'fastify';
import { slotsController } from './slots.controller.js';
import { authenticate } from '../../shared/middlewares/authenticate.js';
import { authorize } from '../../shared/middlewares/authorize.js';

export async function slotsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  fastify.get('/', {
    preHandler: [authorize('slots.view')],
    handler: slotsController.findByVenueAndDate.bind(slotsController),
  });

  fastify.get('/availability', {
    preHandler: [authorize('slots.view')],
    handler: slotsController.getAvailability.bind(slotsController),
  });

  fastify.get('/search', {
    preHandler: [authorize('slots.view')],
    handler: slotsController.search.bind(slotsController),
  });

  fastify.get('/agenda', {
    preHandler: [authorize('slots.view')],
    handler: slotsController.getAgenda.bind(slotsController),
  });

  fastify.get('/agenda-availability', {
    preHandler: [authorize('slots.view')],
    handler: slotsController.getAgendaMonthAvailability.bind(slotsController),
  });
}
