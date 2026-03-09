import type { FastifyInstance } from 'fastify';
import { venueSchedulesController } from './venue-schedules.controller.js';
import { authenticate } from '../../shared/middlewares/authenticate.js';
import { authorize } from '../../shared/middlewares/authorize.js';

export async function venueSchedulesRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  fastify.get('/', {
    preHandler: [authorize('venue-schedules.view')],
    handler: venueSchedulesController.findAll.bind(venueSchedulesController),
  });

  fastify.get('/:id', {
    preHandler: [authorize('venue-schedules.view')],
    handler: venueSchedulesController.findById.bind(venueSchedulesController),
  });

  fastify.post('/', {
    preHandler: [authorize('venue-schedules.manage')],
    handler: venueSchedulesController.create.bind(venueSchedulesController),
  });

  fastify.put('/:id', {
    preHandler: [authorize('venue-schedules.manage')],
    handler: venueSchedulesController.update.bind(venueSchedulesController),
  });

  fastify.delete('/:id', {
    preHandler: [authorize('venue-schedules.manage')],
    handler: venueSchedulesController.delete.bind(venueSchedulesController),
  });

  fastify.post('/:id/generate-slots', {
    preHandler: [authorize('venue-schedules.manage')],
    handler: venueSchedulesController.generateSlots.bind(venueSchedulesController),
  });
}
