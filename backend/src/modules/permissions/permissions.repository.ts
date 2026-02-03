import { prisma } from '../../infrastructure/database/client.js';
import type { PermissionRecord, PermissionFilters } from './permissions.types.js';

export class PermissionsRepository {
  async findAll(
    filters: PermissionFilters,
    page: number,
    limit: number
  ): Promise<{ permissions: PermissionRecord[]; total: number }> {
    const where: any = {};

    if (filters.search) {
      where.OR = [
        { resource: { contains: filters.search, mode: 'insensitive' } },
        { action: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.resource) {
      where.resource = { contains: filters.resource, mode: 'insensitive' };
    }

    if (filters.action) {
      where.action = { contains: filters.action, mode: 'insensitive' };
    }

    if (filters.description) {
      where.description = { contains: filters.description, mode: 'insensitive' };
    }

    const orderBy: any = filters.sortBy
      ? { [filters.sortBy]: filters.sortDirection || 'asc' }
      : [{ resource: 'asc' }, { action: 'asc' }];

    const [permissions, total] = await Promise.all([
      prisma.permission.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
      }),
      prisma.permission.count({ where }),
    ]);

    return { permissions, total };
  }

  async findById(id: string): Promise<PermissionRecord | null> {
    return prisma.permission.findUnique({ where: { id } });
  }

  async findByResourceAction(resource: string, action: string) {
    return prisma.permission.findUnique({
      where: { resource_action: { resource, action } },
    });
  }

  async create(data: { resource: string; action: string; description?: string }): Promise<PermissionRecord> {
    return prisma.permission.create({ data });
  }

  async update(id: string, data: { resource?: string; action?: string; description?: string | null }): Promise<PermissionRecord> {
    return prisma.permission.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.permission.delete({ where: { id } });
  }

  async bulkDelete(ids: string[]): Promise<number> {
    const result = await prisma.permission.deleteMany({ where: { id: { in: ids } } });
    return result.count;
  }

  async isAssignedToRoles(id: string): Promise<boolean> {
    const count = await prisma.rolePermission.count({ where: { permissionId: id } });
    return count > 0;
  }

  async getDistinctResources(): Promise<string[]> {
    const resources = await prisma.permission.findMany({
      select: { resource: true },
      distinct: ['resource'],
      orderBy: { resource: 'asc' },
    });
    return resources.map((r) => r.resource);
  }
}

export const permissionsRepository = new PermissionsRepository();
