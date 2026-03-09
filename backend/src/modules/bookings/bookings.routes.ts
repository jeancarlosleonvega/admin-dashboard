import type { FastifyInstance } from 'fastify';
import { bookingsController } from './bookings.controller.js';
import { authenticate } from '../../shared/middlewares/authenticate.js';
import { authorize } from '../../shared/middlewares/authorize.js';
import { prisma } from '../../infrastructure/database/client.js';
import { cacheService } from '../../infrastructure/cache/cacheService.js';

async function setIsAdmin(request: any) {
  const userId = request.user?.userId;
  if (!userId) return;
  const cacheKey = `permissions:${userId}`;
  let permissions: string[] | null = await cacheService.get<string[]>(cacheKey);
  if (!permissions) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: { include: { rolePermissions: { include: { permission: true } } } },
          },
        },
      },
    });
    permissions = [];
    if (user) {
      for (const ur of user.userRoles) {
        for (const rp of ur.role.rolePermissions) {
          permissions.push(`${rp.permission.resource}.${rp.permission.action}`);
        }
      }
    }
  }
  request.isAdmin = Array.isArray(permissions) && permissions.includes('bookings.manage');
}

export async function bookingsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  fastify.get('/my', {
    handler: bookingsController.findMy.bind(bookingsController),
  });

  fastify.get('/', {
    preHandler: [authorize('bookings.view')],
    handler: bookingsController.findAll.bind(bookingsController),
  });

  fastify.get('/:id', {
    preHandler: [authorize('bookings.view')],
    handler: bookingsController.findById.bind(bookingsController),
  });

  fastify.post('/', {
    handler: bookingsController.create.bind(bookingsController),
  });

  fastify.delete('/:id', {
    preHandler: [
      async (request: any, _reply: any) => {
        await setIsAdmin(request);
      },
    ],
    handler: bookingsController.cancel.bind(bookingsController),
  });
}
