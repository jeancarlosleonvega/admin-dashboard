import type { FastifyInstance } from 'fastify';
import { paymentsController } from './payments.controller.js';
import { authenticate } from '../../shared/middlewares/authenticate.js';
import { authorize } from '../../shared/middlewares/authorize.js';

export async function paymentsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  fastify.get('/', {
    preHandler: [authorize('payments.view')],
    handler: paymentsController.findAll.bind(paymentsController),
  });

  fastify.get('/pending-transfers', {
    preHandler: [authorize('payments.view')],
    handler: paymentsController.findPendingTransfers.bind(paymentsController),
  });

  fastify.post('/:id/transfer-proof', {
    handler: paymentsController.uploadTransferProof.bind(paymentsController),
  });

  fastify.put('/:id/validate', {
    preHandler: [authorize('payments.manage')],
    handler: paymentsController.validateTransfer.bind(paymentsController),
  });
}
