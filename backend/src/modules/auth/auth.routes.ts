import type { FastifyInstance } from 'fastify';
import { authController } from './auth.controller.js';
import { authenticate } from '../../shared/middlewares/authenticate.js';

export async function authRoutes(fastify: FastifyInstance) {
  // Public routes
  fastify.post('/register', authController.register.bind(authController));
  fastify.post('/login', authController.login.bind(authController));
  fastify.post('/refresh', authController.refresh.bind(authController));
  fastify.post('/forgot-password', authController.forgotPassword.bind(authController));
  fastify.post('/reset-password', authController.resetPassword.bind(authController));

  // Protected routes
  fastify.post('/logout', {
    preHandler: [authenticate],
    handler: authController.logout.bind(authController),
  });

  fastify.get('/me', {
    preHandler: [authenticate],
    handler: authController.me.bind(authController),
  });
}
