import type { FastifyRequest, FastifyReply } from 'fastify';
import { paymentsService } from './payments.service.js';
import { transferProofSchema, validateTransferSchema } from './payments.schema.js';
import { successResponse } from '../../shared/utils/response.js';
import { ValidationError } from '../../shared/errors/ValidationError.js';

export class PaymentsController {
  async findMy(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.userId;
    const items = await paymentsService.findMy(userId);
    return reply.send(successResponse(items));
  }

  async findAll(request: FastifyRequest<{ Querystring: { method?: string } }>, reply: FastifyReply) {
    const items = await paymentsService.findAll(request.query.method);
    return reply.send(successResponse(items));
  }

  async findPendingTransfers(request: FastifyRequest, reply: FastifyReply) {
    const items = await paymentsService.findPendingTransfers();
    return reply.send(successResponse(items));
  }

  async uploadTransferProof(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const userId = (request as any).user.userId;
    const parsed = transferProofSchema.safeParse(request.body);
    if (!parsed.success) throw new ValidationError('Validation failed', parsed.error.errors);
    const item = await paymentsService.uploadTransferProof(request.params.id, userId, parsed.data);
    return reply.send(successResponse(item));
  }

  async validateTransfer(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const adminId = (request as any).user.userId;
    const parsed = validateTransferSchema.safeParse(request.body);
    if (!parsed.success) throw new ValidationError('Validation failed', parsed.error.errors);
    const item = await paymentsService.validateTransfer(request.params.id, adminId, parsed.data);
    return reply.send(successResponse(item));
  }
}

export const paymentsController = new PaymentsController();
