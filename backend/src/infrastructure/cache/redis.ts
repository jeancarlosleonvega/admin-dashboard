import Redis from 'ioredis';
import { cacheConfig } from '../../config/cache.js';
import { logger } from '../../shared/utils/logger.js';

let redis: Redis | null = null;

export function getRedisClient(): Redis | null {
  if (!cacheConfig.redis.enabled || !cacheConfig.redis.url) {
    return null;
  }

  if (!redis) {
    redis = new Redis(cacheConfig.redis.url, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) {
          logger.warn('Redis connection failed, disabling cache');
          return null;
        }
        return Math.min(times * 200, 1000);
      },
    });

    redis.on('connect', () => {
      logger.info('Redis connected');
    });

    redis.on('error', (err) => {
      logger.error({ err }, 'Redis error');
    });
  }

  return redis;
}

export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}
