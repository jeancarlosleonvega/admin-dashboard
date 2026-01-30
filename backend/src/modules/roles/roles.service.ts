import { rolesRepository } from './roles.repository.js';
import { NotFoundError } from '../../shared/errors/NotFoundError.js';
import { ValidationError } from '../../shared/errors/ValidationError.js';
import { cacheService } from '../../infrastructure/cache/cacheService.js';
import type { CreateRoleInput, UpdateRoleInput, RoleFiltersInput } from './roles.schema.js';
import type { PaginatedRoles, RoleWithPermissions } from './roles.types.js';

export class RolesService {
  async findAll(filters: RoleFiltersInput): Promise<PaginatedRoles> {
    const { page, limit, ...filterParams } = filters;
    const { roles, total } = await rolesRepository.findAll(filterParams, page, limit);

    return {
      roles,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<RoleWithPermissions> {
    const role = await rolesRepository.findById(id);
    if (!role) {
      throw new NotFoundError('Role not found');
    }
    return role;
  }

  async create(data: CreateRoleInput): Promise<RoleWithPermissions> {
    const existing = await rolesRepository.findByName(data.name);
    if (existing) {
      throw new ValidationError('Role with this name already exists');
    }

    return rolesRepository.create(data);
  }

  async update(id: string, data: UpdateRoleInput): Promise<RoleWithPermissions> {
    const role = await rolesRepository.findById(id);
    if (!role) {
      throw new NotFoundError('Role not found');
    }

    if (role.isSystem && data.name && data.name !== role.name) {
      throw new ValidationError('Cannot rename system roles');
    }

    if (data.name && data.name !== role.name) {
      const existing = await rolesRepository.findByName(data.name);
      if (existing) {
        throw new ValidationError('Role with this name already exists');
      }
    }

    const updated = await rolesRepository.update(id, data);

    // Invalidate permissions cache for all users with this role if permissions changed
    if (data.permissionIds !== undefined) {
      await cacheService.deletePattern('permissions:*');
    }

    return updated;
  }

  async delete(id: string): Promise<void> {
    const role = await rolesRepository.findById(id);
    if (!role) {
      throw new NotFoundError('Role not found');
    }

    if (role.isSystem) {
      throw new ValidationError('Cannot delete system roles');
    }

    const hasUsers = await rolesRepository.hasUsers(id);
    if (hasUsers) {
      throw new ValidationError('Cannot delete role that is assigned to users. Remove all users from this role first.');
    }

    await rolesRepository.delete(id);
  }
}

export const rolesService = new RolesService();
