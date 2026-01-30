import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { AppError } from '../errors/AppError.js';
import { sendError } from '../utils/response.js';
import { logger } from '../utils/logger.js';

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  logger.error({ err: error, requestId: request.id }, 'Error occurred');

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const details = error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return sendError(reply, 'VALIDATION_ERROR', 'Validation failed', 400, details);
  }

  // Handle custom AppError
  if (error instanceof AppError) {
    return sendError(
      reply,
      error.code,
      error.message,
      error.statusCode,
      error.details
    );
  }

  // Handle Fastify validation errors
  if (error.validation) {
    const details = error.validation.map((v) => ({
      field: v.instancePath || v.schemaPath,
      message: v.message || 'Invalid value',
    }));
    return sendError(reply, 'VALIDATION_ERROR', 'Validation failed', 400, details);
  }

  // Handle other errors
  const statusCode = error.statusCode || 500;
  const message =
    statusCode === 500 ? 'Internal server error' : error.message;

  return sendError(reply, 'INTERNAL_ERROR', message, statusCode);
}
