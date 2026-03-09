import type { FastifyRequest, FastifyReply } from 'fastify';
import { qrService } from './qr.service.js';
import { successResponse } from '../../shared/utils/response.js';

export class QRController {
  async validate(
    request: FastifyRequest<{ Params: { code: string } }>,
    reply: FastifyReply
  ) {
    const result = await qrService.validate(request.params.code);
    return reply.send(successResponse(result));
  }
}

export const qrController = new QRController();
