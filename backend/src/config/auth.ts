import { env } from './env.js';

export const authConfig = {
  jwt: {
    accessSecret: env.JWT_ACCESS_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    accessExpiry: env.JWT_ACCESS_EXPIRY,
    refreshExpiry: env.JWT_REFRESH_EXPIRY,
  },
  bcrypt: {
    saltRounds: 12,
  },
  cookie: {
    refreshTokenName: 'refreshToken',
    options: {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/api/auth/refresh',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    },
  },
};
