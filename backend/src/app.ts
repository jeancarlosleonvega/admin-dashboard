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
import { userMembershipsRoutes } from './modules/user-memberships/user-memberships.routes.js';
import { blockedPeriodsRoutes } from './modules/blocked-periods/blocked-periods.routes.js';
import { venueSchedulesRoutes } from './modules/venue-schedules/venue-schedules.routes.js';
import { slotsRoutes } from './modules/slots/slots.routes.js';
import { additionalServicesRoutes } from './modules/additional-services/additional-services.routes.js';
import { bookingsRoutes } from './modules/bookings/bookings.routes.js';
import { paymentsRoutes } from './modules/payments/payments.routes.js';
import { qrRoutes } from './modules/qr/qr.routes.js';
import { conditionTypesRoutes } from './modules/condition-types/condition-types.routes.js';
import { walletRoutes } from './modules/wallet/wallet.routes.js';

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
    api.register(userMembershipsRoutes, { prefix: '/user-memberships' });
    api.register(blockedPeriodsRoutes, { prefix: '/blocked-periods' });
    api.register(venueSchedulesRoutes, { prefix: '/venue-schedules' });
    api.register(slotsRoutes, { prefix: '/slots' });
    api.register(additionalServicesRoutes, { prefix: '/additional-services' });
    api.register(bookingsRoutes, { prefix: '/bookings' });
    api.register(paymentsRoutes, { prefix: '/payments' });
    api.register(qrRoutes, { prefix: '/qr' });
    api.register(conditionTypesRoutes, { prefix: '/condition-types' });
    api.register(walletRoutes, { prefix: '/wallet' });
  }, { prefix: '/api' });

  return app;
}
