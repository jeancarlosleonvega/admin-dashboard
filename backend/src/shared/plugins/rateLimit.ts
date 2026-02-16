import rateLimit from '@fastify/rate-limit';
import { FastifyInstance } from 'fastify';
import { env } from '../../config/env.js';

export async function registerRateLimit(app: FastifyInstance) {
  if (env.NODE_ENV === 'development') {
    return;
  }

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later',
      },
      timestamp: new Date().toISOString(),
    }),
  });
}
