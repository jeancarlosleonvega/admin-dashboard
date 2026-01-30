import type { FastifyRequest, FastifyReply } from 'fastify';
import { verifyAccessToken } from '../utils/jwt.js';
import { AuthenticationError } from '../errors/AuthenticationError.js';

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthenticationError('No token provided');
  }

  const token = authHeader.substring(7);

  try {
    const payload = verifyAccessToken(token);
    request.user = payload;
  } catch (error) {
    throw new AuthenticationError('Invalid or expired token');
  }
}
