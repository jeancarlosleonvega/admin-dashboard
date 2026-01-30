import { getRedisClient } from './redis.js';
import { logger } from '../../shared/utils/logger.js';

export class CacheService {
  private redis = getRedisClient();

  async get<T>(key: string): Promise<T | null> {
    if (!this.redis) return null;

    try {
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error({ error, key }, 'Cache get error');
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    if (!this.redis) return;

    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.redis.setex(key, ttlSeconds, serialized);
      } else {
        await this.redis.set(key, serialized);
      }
    } catch (error) {
      logger.error({ error, key }, 'Cache set error');
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.redis) return;

    try {
      await this.redis.del(key);
    } catch (error) {
      logger.error({ error, key }, 'Cache delete error');
    }
  }

  async deletePattern(pattern: string): Promise<void> {
    if (!this.redis) return;

    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      logger.error({ error, pattern }, 'Cache delete pattern error');
    }
  }
}

export const cacheService = new CacheService();
