import Fastify, { FastifyInstance } from 'fastify';
import { env } from './config/env.js';
import { logger } from './shared/utils/logger.js';
import { errorHandler } from './shared/middlewares/errorHandler.js';
import { requestLogger } from './shared/middlewares/requestLogger.js';
import {
  registerCors,
  registerHelmet,
  registerSwagger,
  registerRateLimit,
  registerCookie,
} from './shared/plugins/index.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { usersRoutes } from './modules/users/users.routes.js';
import { rolesRoutes } from './modules/roles/roles.routes.js';
import { permissionsRoutes } from './modules/permissions/permissions.routes.js';
import { systemConfigRoutes } from './modules/system-config/system-config.routes.js';
import { sportTypesRoutes } from './modules/sport-types/sport-types.routes.js';
import { venuesRoutes } from './modules/venues/venues.routes.js';
import { membershipPlansRoutes } from './modules/membership-plans/membership-plans.routes.js';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false, // We use our own pino logger
    requestIdHeader: 'x-request-id',
    genReqId: () => crypto.randomUUID(),
    bodyLimit: 10 * 1024, // 10kb
  });

  // Register plugins
  await registerCors(app);
  await registerHelmet(app);
  await registerCookie(app);
  await registerRateLimit(app);

  // Register Swagger only in development
  if (env.NODE_ENV !== 'production') {
    await registerSwagger(app);
  }

  // Request logging
  app.addHook('onRequest', requestLogger);

  // Error handler
  app.setErrorHandler(errorHandler);

  // Health check endpoint
  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }));

  // API routes prefix
  app.register(async (api) => {
    api.register(authRoutes, { prefix: '/auth' });
    api.register(usersRoutes, { prefix: '/users' });
    api.register(rolesRoutes, { prefix: '/roles' });
    api.register(permissionsRoutes, { prefix: '/permissions' });
    api.register(systemConfigRoutes, { prefix: '/system-config' });
    api.register(sportTypesRoutes, { prefix: '/sport-types' });
    api.register(venuesRoutes, { prefix: '/venues' });
    api.register(membershipPlansRoutes, { prefix: '/membership-plans' });
  }, { prefix: '/api' });

  return app;
}
