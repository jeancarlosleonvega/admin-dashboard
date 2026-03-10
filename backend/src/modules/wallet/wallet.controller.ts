import type { FastifyRequest, FastifyReply } from 'fastify';
import { walletService } from './wallet.service.js';
import { successResponse } from '../../shared/utils/response.js';

export class WalletController {
  async getMyWallet(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.id;
    const wallet = await walletService.getWalletInfo(userId);
    return reply.send(successResponse(wallet));
  }

  async getMyTransactions(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.id;
    const { page, limit } = request.query as { page?: number; limit?: number };
    const result = await walletService.getTransactions(userId, page ?? 1, limit ?? 20);
    return reply.send(successResponse(result.items, { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages }));
  }
}

export const walletController = new WalletController();
