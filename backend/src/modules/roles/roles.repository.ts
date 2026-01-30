import { prisma } from '../../infrastructure/database/client.js';
import type { RoleWithPermissions, RoleFilters } from './roles.types.js';

export class RolesRepository {
  async findAll(
    filters: RoleFilters,
    page: number,
    limit: number
  ): Promise<{ roles: RoleWithPermissions[]; total: number }> {
    const where: any = {};

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.name) {
      where.name = { contains: filters.name, mode: 'insensitive' };
    }

    if (filters.description) {
      where.description = { contains: filters.description, mode: 'insensitive' };
    }

    if (filters.isSystem !== undefined) {
      where.isSystem = filters.isSystem === 'true';
    }

    const orderBy: any = filters.sortBy
      ? { [filters.sortBy]: filters.sortDirection || 'asc' }
      : { name: 'asc' };

    const [roles, total] = await Promise.all([
      prisma.role.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        include: {
          rolePermissions: {
            include: {
              permission: true,
            },
          },
        },
      }),
      prisma.role.count({ where }),
    ]);

    return {
      roles: roles.map((role) => ({
        ...role,
        permissions: role.rolePermissions.map((rp) => rp.permission),
      })),
      total,
    };
  }

  async findById(id: string): Promise<RoleWithPermissions | null> {
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) return null;

    return {
      ...role,
      permissions: role.rolePermissions.map((rp) => rp.permission),
    };
  }

  async findByName(name: string) {
    return prisma.role.findUnique({ where: { name } });
  }

  async create(data: {
    name: string;
    description?: string;
    permissionIds?: string[];
  }): Promise<RoleWithPermissions> {
    const role = await prisma.role.create({
      data: {
        name: data.name,
        description: data.description,
        rolePermissions: data.permissionIds
          ? { create: data.permissionIds.map((permissionId) => ({ permissionId })) }
          : undefined,
      },
      include: {
        rolePermissions: {
          include: { permission: true },
        },
      },
    });

    return {
      ...role,
      permissions: role.rolePermissions.map((rp) => rp.permission),
    };
  }

  async update(
    id: string,
    data: { name?: string; description?: string | null; permissionIds?: string[] }
  ): Promise<RoleWithPermissions> {
    if (data.permissionIds !== undefined) {
      await prisma.rolePermission.deleteMany({ where: { roleId: id } });
      if (data.permissionIds.length > 0) {
        await prisma.rolePermission.createMany({
          data: data.permissionIds.map((permissionId) => ({ roleId: id, permissionId })),
        });
      }
    }

    const { permissionIds, ...updateData } = data;

    const role = await prisma.role.update({
      where: { id },
      data: updateData,
      include: {
        rolePermissions: {
          include: { permission: true },
        },
      },
    });

    return {
      ...role,
      permissions: role.rolePermissions.map((rp) => rp.permission),
    };
  }

  async delete(id: string): Promise<void> {
    await prisma.role.delete({ where: { id } });
  }

  async hasUsers(id: string): Promise<boolean> {
    const count = await prisma.userRole.count({ where: { roleId: id } });
    return count > 0;
  }
}

export const rolesRepository = new RolesRepository();
