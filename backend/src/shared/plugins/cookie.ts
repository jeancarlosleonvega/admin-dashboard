import cookie from '@fastify/cookie';
import { FastifyInstance } from 'fastify';

export async function registerCookie(app: FastifyInstance) {
  await app.register(cookie, {
    hook: 'onRequest',
  });
}
