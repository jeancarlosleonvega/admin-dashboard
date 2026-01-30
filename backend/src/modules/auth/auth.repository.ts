import { prisma } from '../../infrastructure/database/client.js';
import type { SafeUser } from './auth.types.js';

export class AuthRepository {
  async findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
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
  }

  async findUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
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
  }

  async createUser(data: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
  }) {
    return prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        status: 'ACTIVE',
      },
    });
  }

  async updateTokenVersion(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        tokenVersion: { increment: 1 },
      },
    });
  }

  async getTokenVersion(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tokenVersion: true },
    });
    return user?.tokenVersion ?? 0;
  }

  async assignRoleToUser(userId: string, roleId: string, assignedBy?: string) {
    return prisma.userRole.create({
      data: {
        userId,
        roleId,
        assignedBy,
      },
    });
  }

  async getDefaultRole() {
    return prisma.role.findFirst({
      where: { name: 'User' },
    });
  }

  extractPermissions(user: Awaited<ReturnType<typeof this.findUserByEmail>>): string[] {
    if (!user) return [];

    const permissions = new Set<string>();

    for (const userRole of user.userRoles) {
      for (const rolePermission of userRole.role.rolePermissions) {
        const perm = rolePermission.permission;
        permissions.add(`${perm.resource}.${perm.action}`);
      }
    }

    return Array.from(permissions);
  }

  async createPasswordReset(userId: string, tokenHash: string, expiresAt: Date) {
    // Delete any existing reset tokens for this user
    await prisma.passwordReset.deleteMany({ where: { userId } });

    return prisma.passwordReset.create({
      data: { userId, tokenHash, expiresAt },
    });
  }

  async findValidPasswordReset(tokenHash: string) {
    return prisma.passwordReset.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });
  }

  async markPasswordResetUsed(id: string) {
    return prisma.passwordReset.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  async updateUserPassword(userId: string, passwordHash: string) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        tokenVersion: { increment: 1 },
      },
    });
  }

  toSafeUser(user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    passwordHash?: string;
    tokenVersion?: number;
  }): SafeUser {
    const { passwordHash, tokenVersion, ...safeUser } = user as any;
    return safeUser;
  }
}

export const authRepository = new AuthRepository();
