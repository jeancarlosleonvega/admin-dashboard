import type { FastifyRequest, FastifyReply } from 'fastify';
import { userMembershipsService } from './user-memberships.service.js';
import {
  createUserMembershipSchema,
  updateUserMembershipSchema,
  userMembershipFiltersSchema,
} from './user-memberships.schema.js';
import { successResponse } from '../../shared/utils/response.js';
import { ValidationError } from '../../shared/errors/ValidationError.js';

export class UserMembershipsController {
  async findAll(request: FastifyRequest, reply: FastifyReply) {
    const parsed = userMembershipFiltersSchema.safeParse(request.query);
    if (!parsed.success) throw new ValidationError('Filtros inválidos', parsed.error.errors);
    const result = await userMembershipsService.findAll(parsed.data);
    return reply.send(
      successResponse(result.items, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      })
    );
  }

  async findMy(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.userId;
    const item = await userMembershipsService.findMyActiveMembership(userId);
    return reply.send(successResponse(item));
  }

  async findById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const item = await userMembershipsService.findById(request.params.id);
    return reply.send(successResponse(item));
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const parsed = createUserMembershipSchema.safeParse(request.body);
    if (!parsed.success) throw new ValidationError('Validation failed', parsed.error.errors);
    const item = await userMembershipsService.create(parsed.data);
    return reply.status(201).send(successResponse(item));
  }

  async update(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const parsed = updateUserMembershipSchema.safeParse(request.body);
    if (!parsed.success) throw new ValidationError('Validation failed', parsed.error.errors);
    const item = await userMembershipsService.update(request.params.id, parsed.data);
    return reply.send(successResponse(item));
  }

  async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    await userMembershipsService.delete(request.params.id);
    return reply.send(successResponse({ message: 'Membresía cancelada' }));
  }

  async subscribe(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.userId;
    const { membershipPlanId } = request.body as { membershipPlanId: string };
    if (!membershipPlanId) throw new ValidationError('membershipPlanId es requerido');
    const result = await userMembershipsService.subscribe(userId, membershipPlanId);
    return reply.send(successResponse(result));
  }

  async mpWebhook(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as any;
    const type: string = body?.type ?? '';
    const dataId: string = body?.data?.id ?? '';
    if (type && dataId) {
      // No awaiting — responder inmediatamente a MP
      userMembershipsService.handleMpWebhook(type, dataId).catch(() => {});
    }
    return reply.status(200).send({ received: true });
  }
}

export const userMembershipsController = new UserMembershipsController();
