import { User } from '@prisma/client';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: SafeUser;
  permissions: string[];
  accessToken: string;
}

export type SafeUser = Omit<User, 'passwordHash' | 'tokenVersion'>;

export interface RefreshTokenPayload {
  userId: string;
  tokenVersion: number;
}

export interface AccessTokenPayload {
  userId: string;
  email: string;
}
