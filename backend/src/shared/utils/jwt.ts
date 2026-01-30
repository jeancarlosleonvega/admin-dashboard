import jwt, { SignOptions } from 'jsonwebtoken';
import { authConfig } from '../../config/auth.js';

export interface AccessTokenPayload {
  userId: string;
  email: string;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenVersion: number;
}

export function generateAccessToken(payload: AccessTokenPayload): string {
  const options: SignOptions = {
    expiresIn: authConfig.jwt.accessExpiry as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, authConfig.jwt.accessSecret, options);
}

export function generateRefreshToken(payload: RefreshTokenPayload): string {
  const options: SignOptions = {
    expiresIn: authConfig.jwt.refreshExpiry as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, authConfig.jwt.refreshSecret, options);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, authConfig.jwt.accessSecret) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, authConfig.jwt.refreshSecret) as RefreshTokenPayload;
}
