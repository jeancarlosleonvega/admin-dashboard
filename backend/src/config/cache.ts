import { env } from './env.js';

export const cacheConfig = {
  redis: {
    url: env.REDIS_URL,
    enabled: !!env.REDIS_URL,
  },
  ttl: {
    permissions: 300, // 5 minutes
    user: 60, // 1 minute
    session: 900, // 15 minutes
  },
};
