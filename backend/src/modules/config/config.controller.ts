import type { FastifyRequest, FastifyReply } from 'fastify';
import { configService } from './config.service.js';
import { upsertConfigSchema, upsertManyConfigSchema } from './config.schema.js';
import { successResponse } from '../../shared/utils/response.js';
import { ValidationError } from '../../shared/errors/ValidationError.js';

export class ConfigController {
  async findAll(request: FastifyRequest<{ Querystring: { group?: string } }>, reply: FastifyReply) {
    const configs = await configService.findAll(request.query.group);
    return reply.send(successResponse(configs));
  }

  async findByKey(request: FastifyRequest<{ Params: { key: string } }>, reply: FastifyReply) {
    const config = await configService.findByKey(request.params.key);
    return reply.send(successResponse(config));
  }

  async upsert(request: FastifyRequest, reply: FastifyReply) {
    const parsed = upsertConfigSchema.safeParse(request.body);
    if (!parsed.success) throw new ValidationError('Validation failed', parsed.error.errors);
    const config = await configService.upsert(parsed.data);
    return reply.status(200).send(successResponse(config));
  }

  async upsertMany(request: FastifyRequest, reply: FastifyReply) {
    const parsed = upsertManyConfigSchema.safeParse(request.body);
    if (!parsed.success) throw new ValidationError('Validation failed', parsed.error.errors);
    const configs = await configService.upsertMany(parsed.data);
    return reply.status(200).send(successResponse(configs));
  }

  async delete(request: FastifyRequest<{ Params: { key: string } }>, reply: FastifyReply) {
    await configService.delete(request.params.key);
    return reply.send(successResponse({ message: 'Config deleted' }));
  }
}

export const configController = new ConfigController();
