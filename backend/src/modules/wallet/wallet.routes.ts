import type { FastifyInstance } from 'fastify';
import { walletController } from './wallet.controller.js';
import { authenticate } from '../../shared/middlewares/authenticate.js';
import { authorize } from '../../shared/middlewares/authorize.js';

export async function walletRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  fastify.get('/me', {
    preHandler: [authorize('wallet.view')],
    handler: walletController.getMyWallet.bind(walletController),
  });

  fastify.get('/me/transactions', {
    preHandler: [authorize('wallet.view')],
    handler: walletController.getMyTransactions.bind(walletController),
  });
}
