import type { FastifyRequest, FastifyReply } from 'fastify';
import { authService } from './auth.service.js';
import { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema } from './auth.schema.js';
import { successResponse } from '../../shared/utils/response.js';
import { ValidationError } from '../../shared/errors/ValidationError.js';
import { authConfig } from '../../config/auth.js';

export class AuthController {
  async register(request: FastifyRequest, reply: FastifyReply) {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new ValidationError('Validation failed', parsed.error.errors);
    }

    const result = await authService.register(parsed.data);
    return reply.status(201).send(successResponse(result));
  }

  async login(request: FastifyRequest, reply: FastifyReply) {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new ValidationError('Validation failed', parsed.error.errors);
    }

    const { refreshToken, ...result } = await authService.login(parsed.data);

    // Set refresh token as httpOnly cookie
    reply.setCookie(authConfig.cookie.refreshTokenName, refreshToken, {
      httpOnly: authConfig.cookie.options.httpOnly,
      secure: authConfig.cookie.options.secure,
      sameSite: authConfig.cookie.options.sameSite,
      path: authConfig.cookie.options.path,
      maxAge: authConfig.cookie.options.maxAge / 1000, // Convert to seconds
    });

    return reply.send(successResponse(result));
  }

  async logout(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user?.userId;
    if (userId) {
      await authService.logout(userId);
    }

    // Clear refresh token cookie
    reply.clearCookie(authConfig.cookie.refreshTokenName, {
      path: authConfig.cookie.options.path,
    });

    return reply.send(successResponse({ message: 'Logged out successfully' }));
  }

  async refresh(request: FastifyRequest, reply: FastifyReply) {
    const refreshToken = request.cookies[authConfig.cookie.refreshTokenName];
    if (!refreshToken) {
      throw new ValidationError('Refresh token not provided');
    }

    const result = await authService.refresh(refreshToken);
    return reply.send(successResponse(result));
  }

  async me(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.userId;
    const result = await authService.me(userId);
    return reply.send(successResponse(result));
  }
  async forgotPassword(request: FastifyRequest, reply: FastifyReply) {
    const parsed = forgotPasswordSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new ValidationError('Validation failed', parsed.error.errors);
    }

    await authService.forgotPassword(parsed.data.email);

    // Always return success to prevent email enumeration
    return reply.send(
      successResponse({ message: 'If the email exists, a reset link has been sent' })
    );
  }

  async resetPassword(request: FastifyRequest, reply: FastifyReply) {
    const parsed = resetPasswordSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new ValidationError('Validation failed', parsed.error.errors);
    }

    await authService.resetPassword(parsed.data.token, parsed.data.password);

    return reply.send(
      successResponse({ message: 'Password has been reset successfully' })
    );
  }
}

export const authController = new AuthController();
