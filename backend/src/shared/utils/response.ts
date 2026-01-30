import { FastifyReply } from 'fastify';

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
  requestId?: string;
}

interface ErrorDetail {
  field?: string;
  message: string;
}

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ErrorDetail[];
  };
  requestId?: string;
  timestamp: string;
}

export function sendSuccess<T>(
  reply: FastifyReply,
  data: T,
  statusCode = 200,
  meta?: PaginationMeta
): FastifyReply {
  const response: SuccessResponse<T> = {
    success: true,
    data,
    ...(meta && { meta }),
    requestId: reply.request.id,
  };

  return reply.status(statusCode).send(response);
}

export function sendError(
  reply: FastifyReply,
  code: string,
  message: string,
  statusCode = 400,
  details?: ErrorDetail[]
): FastifyReply {
  const response: ErrorResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
    requestId: reply.request.id,
    timestamp: new Date().toISOString(),
  };

  return reply.status(statusCode).send(response);
}

export function createPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

export function successResponse<T>(data: T, meta?: PaginationMeta): SuccessResponse<T> {
  return {
    success: true,
    data,
    ...(meta && { meta }),
  };
}
