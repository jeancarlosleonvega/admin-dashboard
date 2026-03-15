import type { FastifyRequest, FastifyReply } from 'fastify';
import { membershipPlansService } from './membership-plans.service.js';
import { createMembershipPlanSchema, updateMembershipPlanSchema, membershipPlanFiltersSchema } from './membership-plans.schema.js';
import { successResponse } from '../../shared/utils/response.js';
import { ValidationError } from '../../shared/errors/ValidationError.js';

export class MembershipPlansController {
  async findActive(request: FastifyRequest, reply: FastifyReply) {
    const items = await membershipPlansService.findActive();
    return reply.send(successResponse(items));
  }

  async findAll(request: FastifyRequest, reply: FastifyReply) {
    const parsed = membershipPlanFiltersSchema.safeParse(request.query);
    if (!parsed.success) throw new ValidationError('Filtros inválidos', parsed.error.errors);
    const result = await membershipPlansService.findAll(parsed.data);
    return reply.send(successResponse(result.items, { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages }));
  }

  async findById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const item = await membershipPlansService.findById(request.params.id);
    return reply.send(successResponse(item));
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const parsed = createMembershipPlanSchema.safeParse(request.body);
    if (!parsed.success) throw new ValidationError('Validation failed', parsed.error.errors);
    const item = await membershipPlansService.create(parsed.data);
    return reply.status(201).send(successResponse(item));
  }

  async update(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const parsed = updateMembershipPlanSchema.safeParse(request.body);
    if (!parsed.success) throw new ValidationError('Validation failed', parsed.error.errors);
    const item = await membershipPlansService.update(request.params.id, parsed.data);
    return reply.send(successResponse(item));
  }

  async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    await membershipPlansService.delete(request.params.id);
    return reply.send(successResponse({ message: 'Plan eliminado' }));
  }
}

export const membershipPlansController = new MembershipPlansController();
