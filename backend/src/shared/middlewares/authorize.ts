import type { FastifyRequest, FastifyReply } from 'fastify';
import { AuthorizationError } from '../errors/AuthorizationError.js';
import { prisma } from '../../infrastructure/database/client.js';
import { cacheService } from '../../infrastructure/cache/cacheService.js';

const PERMISSIONS_CACHE_TTL = 900; // 15 minutes in seconds

async function getUserPermissions(userId: string): Promise<Set<string>> {
  const cacheKey = `permissions:${userId}`;

  // Try to get from cache
  const cached = await cacheService.get<string[]>(cacheKey);
  if (cached) {
    return new Set(cached);
  }

  // Fetch from database
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw new AuthorizationError('User not found');
  }

  // Extract user permissions
  const userPermissions = new Set<string>();
  for (const userRole of user.userRoles) {
    for (const rolePermission of userRole.role.rolePermissions) {
      const perm = rolePermission.permission;
      userPermissions.add(`${perm.resource}.${perm.action}`);
    }
  }

  // Cache the permissions
  await cacheService.set(cacheKey, Array.from(userPermissions), PERMISSIONS_CACHE_TTL);

  return userPermissions;
}

export function authorize(requiredPermissions: string | string[]) {
  const permissions = Array.isArray(requiredPermissions)
    ? requiredPermissions
    : [requiredPermissions];

  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const userId = request.user?.userId;

    if (!userId) {
      throw new AuthorizationError('User not authenticated');
    }

    // Get user permissions (from cache or database)
    const userPermissions = await getUserPermissions(userId);

    // Check if user has all required permissions
    const hasPermission = permissions.every((p) => userPermissions.has(p));

    if (!hasPermission) {
      throw new AuthorizationError('Insufficient permissions');
    }
  };
}

// Utility function to invalidate user permissions cache
export async function invalidateUserPermissions(userId: string): Promise<void> {
  await cacheService.delete(`permissions:${userId}`);
}
