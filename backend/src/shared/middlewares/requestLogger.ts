import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../utils/logger.js';

export function requestLogger(
  request: FastifyRequest,
  _reply: FastifyReply,
  done: () => void
) {
  logger.info(
    {
      requestId: request.id,
      method: request.method,
      url: request.url,
      userAgent: request.headers['user-agent'],
    },
    'Incoming request'
  );
  done();
}
