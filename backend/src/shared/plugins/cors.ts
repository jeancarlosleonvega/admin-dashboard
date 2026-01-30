import cors from '@fastify/cors';
import { FastifyInstance } from 'fastify';
import { env } from '../../config/env.js';

export async function registerCors(app: FastifyInstance) {
  await app.register(cors, {
    origin: env.CORS_ORIGIN.split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
}
