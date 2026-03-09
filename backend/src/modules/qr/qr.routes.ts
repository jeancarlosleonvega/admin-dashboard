import type { FastifyInstance } from 'fastify';
import { qrController } from './qr.controller.js';
import { authenticate } from '../../shared/middlewares/authenticate.js';
import { authorize } from '../../shared/middlewares/authorize.js';

export async function qrRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  fastify.get('/:code', {
    preHandler: [authorize('qr.validate')],
    handler: qrController.validate.bind(qrController),
  });
}
