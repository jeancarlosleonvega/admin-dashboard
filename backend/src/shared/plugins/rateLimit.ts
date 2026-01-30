import rateLimit from '@fastify/rate-limit';
import { FastifyInstance } from 'fastify';

export async function registerRateLimit(app: FastifyInstance) {
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
