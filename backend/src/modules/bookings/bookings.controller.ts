import type { FastifyRequest, FastifyReply } from 'fastify';
import { bookingsService } from './bookings.service.js';
import {
  createBookingSchema,
  bookingFiltersSchema,
  myBookingFiltersSchema,
} from './bookings.schema.js';
import { successResponse } from '../../shared/utils/response.js';
import { ValidationError } from '../../shared/errors/ValidationError.js';

export class BookingsController {
  async findMy(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.userId;
    const parsed = myBookingFiltersSchema.safeParse(request.query);
    if (!parsed.success) throw new ValidationError('Filtros inválidos', parsed.error.errors);
    const result = await bookingsService.findMy(userId, parsed.data);
    return reply.send(
      successResponse(result.items, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      })
    );
  }

  async findAll(request: FastifyRequest, reply: FastifyReply) {
    const parsed = bookingFiltersSchema.safeParse(request.query);
    if (!parsed.success) throw new ValidationError('Filtros inválidos', parsed.error.errors);
    const result = await bookingsService.findAll(parsed.data);
    return reply.send(
      successResponse(result.items, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      })
    );
  }

  async findById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const item = await bookingsService.findById(request.params.id);
    return reply.send(successResponse(item));
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.userId;
    const parsed = createBookingSchema.safeParse(request.body);
    if (!parsed.success) throw new ValidationError('Validation failed', parsed.error.errors);
    const item = await bookingsService.create(userId, parsed.data);
    return reply.status(201).send(successResponse(item));
  }

  async markNoShow(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const adminId = (request as any).user.userId;
    const item = await bookingsService.markNoShow(request.params.id, adminId);
    return reply.send(successResponse(item));
  }

  async cancel(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const req = request as any;
    const userId = req.user.userId;
    const isAdmin = req.isAdmin === true;
    await bookingsService.cancel(request.params.id, userId, isAdmin);
    return reply.send(successResponse({ message: 'Reserva cancelada' }));
  }
}

export const bookingsController = new BookingsController();
