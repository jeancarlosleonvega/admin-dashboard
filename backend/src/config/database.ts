import { env } from './env.js';

export const databaseConfig = {
  url: env.DATABASE_URL,
  poolConfig: {
    min: 2,
    max: 20,
    idleTimeoutMillis: 600000, // 10 minutes
    connectionTimeoutMillis: 30000, // 30 seconds
  },
};
