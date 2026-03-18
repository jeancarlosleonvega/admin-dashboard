import type { FastifyRequest, FastifyReply } from 'fastify';
import { createWriteStream, mkdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { pipeline } from 'stream/promises';
import { paymentsService } from './payments.service.js';
import { validateTransferSchema } from './payments.schema.js';
import { successResponse } from '../../shared/utils/response.js';
import { ValidationError } from '../../shared/errors/ValidationError.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const UPLOADS_DIR = join(__dirname, '..', '..', '..', 'uploads', 'proofs');
mkdirSync(UPLOADS_DIR, { recursive: true });

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

    const data = await request.file();
    if (!data) throw new ValidationError('Se requiere un archivo de comprobante');

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedMimeTypes.includes(data.mimetype)) {
      throw new ValidationError('Formato no permitido. Usá JPG, PNG, WEBP o PDF.');
    }

    const ext = data.filename.split('.').pop()?.toLowerCase() ?? 'jpg';
    const filename = `${crypto.randomUUID()}.${ext}`;
    const dest = join(UPLOADS_DIR, filename);

    await pipeline(data.file, createWriteStream(dest));

    const proofUrl = `/uploads/proofs/${filename}`;
    const item = await paymentsService.uploadTransferProof(request.params.id, userId, { proofUrl });
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
