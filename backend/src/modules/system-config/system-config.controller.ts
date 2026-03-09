import type { FastifyRequest, FastifyReply } from 'fastify';
import { systemConfigService } from './system-config.service.js';
import { upsertConfigSchema } from './system-config.schema.js';
import { successResponse } from '../../shared/utils/response.js';
import { ValidationError } from '../../shared/errors/ValidationError.js';

export class SystemConfigController {
  async findAll(request: FastifyRequest, reply: FastifyReply) {
    const configs = await systemConfigService.findAll();
    return reply.send(successResponse(configs));
  }

  async findByKey(request: FastifyRequest<{ Params: { key: string } }>, reply: FastifyReply) {
    const config = await systemConfigService.findByKey(request.params.key);
    return reply.send(successResponse(config));
  }

  async upsert(request: FastifyRequest, reply: FastifyReply) {
    const parsed = upsertConfigSchema.safeParse(request.body);
    if (!parsed.success) throw new ValidationError('Validation failed', parsed.error.errors);
    const config = await systemConfigService.upsert(parsed.data);
    return reply.status(200).send(successResponse(config));
  }

  async delete(request: FastifyRequest<{ Params: { key: string } }>, reply: FastifyReply) {
    await systemConfigService.delete(request.params.key);
    return reply.send(successResponse({ message: 'Config deleted' }));
  }
}

export const systemConfigController = new SystemConfigController();
