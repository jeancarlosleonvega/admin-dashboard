import crypto from 'node:crypto';
import { authRepository } from './auth.repository.js';
import { hashPassword, verifyPassword } from '../../shared/utils/password.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../../shared/utils/jwt.js';
import { AuthenticationError } from '../../shared/errors/AuthenticationError.js';
import { ValidationError } from '../../shared/errors/ValidationError.js';
import { NotFoundError } from '../../shared/errors/NotFoundError.js';
import { invalidateUserPermissions } from '../../shared/middlewares/authorize.js';
import { logger } from '../../shared/utils/logger.js';
import type { LoginInput, RegisterInput } from './auth.schema.js';
import type { AuthResponse } from './auth.types.js';

export class AuthService {
  async register(data: RegisterInput): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await authRepository.findUserByEmail(data.email);
    if (existingUser) {
      throw new ValidationError('Email already registered');
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Create user
    const user = await authRepository.createUser({
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
    });

    // Assign default role
    const defaultRole = await authRepository.getDefaultRole();
    if (defaultRole) {
      await authRepository.assignRoleToUser(user.id, defaultRole.id);
    }

    // Fetch user with roles
    const userWithRoles = await authRepository.findUserById(user.id);
    const permissions = authRepository.extractPermissions(userWithRoles);

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
    });

    return {
      user: authRepository.toSafeUser(user),
      permissions,
      accessToken,
    };
  }

  async login(data: LoginInput): Promise<AuthResponse & { refreshToken: string }> {
    // Find user
    const user = await authRepository.findUserByEmail(data.email);
    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Check status
    if (user.status !== 'ACTIVE') {
      throw new AuthenticationError('Account is not active');
    }

    // Verify password
    const isValid = await verifyPassword(data.password, user.passwordHash);
    if (!isValid) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Extract permissions
    const permissions = authRepository.extractPermissions(user);

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      tokenVersion: user.tokenVersion,
    });

    return {
      user: authRepository.toSafeUser(user),
      permissions,
      accessToken,
      refreshToken,
    };
  }

  async logout(userId: string): Promise<void> {
    // Increment token version to invalidate all refresh tokens
    await authRepository.updateTokenVersion(userId);

    // Invalidate permissions cache
    await invalidateUserPermissions(userId);
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const payload = verifyRefreshToken(refreshToken);

      // Verify token version
      const currentVersion = await authRepository.getTokenVersion(payload.userId);
      if (payload.tokenVersion !== currentVersion) {
        throw new AuthenticationError('Token has been revoked');
      }

      // Get user
      const user = await authRepository.findUserById(payload.userId);
      if (!user || user.status !== 'ACTIVE') {
        throw new AuthenticationError('User not found or inactive');
      }

      // Generate new access token
      const accessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
      });

      return { accessToken };
    } catch (error) {
      if (error instanceof AuthenticationError) throw error;
      throw new AuthenticationError('Invalid refresh token');
    }
  }

  async me(userId: string): Promise<AuthResponse> {
    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    const permissions = authRepository.extractPermissions(user);

    // Generate new access token
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
    });

    return {
      user: authRepository.toSafeUser(user),
      permissions,
      accessToken,
    };
  }
  async forgotPassword(email: string): Promise<void> {
    const user = await authRepository.findUserByEmail(email);

    // Always return success to prevent email enumeration
    if (!user) return;

    // Generate secure random token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await authRepository.createPasswordReset(user.id, tokenHash, expiresAt);

    // In production, send email. In development, log the token.
    logger.info(
      { email, resetToken: token },
      `Password reset requested. Reset link: /reset-password?token=${token}`
    );
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const resetRecord = await authRepository.findValidPasswordReset(tokenHash);

    if (!resetRecord) {
      throw new ValidationError('Invalid or expired reset token');
    }

    const passwordHash = await hashPassword(newPassword);

    await authRepository.updateUserPassword(resetRecord.userId, passwordHash);
    await authRepository.markPasswordResetUsed(resetRecord.id);

    // Invalidate permissions cache
    await invalidateUserPermissions(resetRecord.userId);
  }
}

export const authService = new AuthService();
