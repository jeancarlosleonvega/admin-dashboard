import { PrismaClient } from '@prisma/client';
import { logger } from '../../shared/utils/logger.js';

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'warn' },
    ],
  });

prisma.$on('query' as never, (e: { query: string; duration: number }) => {
  logger.debug({ query: e.query, duration: e.duration }, 'Database query');
});

prisma.$on('error' as never, (e: { message: string }) => {
  logger.error({ error: e.message }, 'Database error');
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
