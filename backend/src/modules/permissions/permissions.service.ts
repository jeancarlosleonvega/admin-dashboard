import { permissionsRepository } from './permissions.repository.js';
import { NotFoundError } from '../../shared/errors/NotFoundError.js';
import { ValidationError } from '../../shared/errors/ValidationError.js';
import type { CreatePermissionInput, UpdatePermissionInput, PermissionFiltersInput } from './permissions.schema.js';
import type { PaginatedPermissions, PermissionRecord } from './permissions.types.js';

export class PermissionsService {
  async findAll(filters: PermissionFiltersInput): Promise<PaginatedPermissions> {
    const { page, limit, ...filterParams } = filters;
    const { permissions, total } = await permissionsRepository.findAll(filterParams, page, limit);

    return {
      permissions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<PermissionRecord> {
    const permission = await permissionsRepository.findById(id);
    if (!permission) {
      throw new NotFoundError('Permission not found');
    }
    return permission;
  }

  async create(data: CreatePermissionInput): Promise<PermissionRecord> {
    const existing = await permissionsRepository.findByResourceAction(data.resource, data.action);
    if (existing) {
      throw new ValidationError('Permission with this resource and action already exists');
    }

    return permissionsRepository.create(data);
  }

  async update(id: string, data: UpdatePermissionInput): Promise<PermissionRecord> {
    const permission = await permissionsRepository.findById(id);
    if (!permission) {
      throw new NotFoundError('Permission not found');
    }

    // Check uniqueness if resource or action is being changed
    const newResource = data.resource ?? permission.resource;
    const newAction = data.action ?? permission.action;

    if (newResource !== permission.resource || newAction !== permission.action) {
      const existing = await permissionsRepository.findByResourceAction(newResource, newAction);
      if (existing && existing.id !== id) {
        throw new ValidationError('Permission with this resource and action already exists');
      }
    }

    return permissionsRepository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    const permission = await permissionsRepository.findById(id);
    if (!permission) {
      throw new NotFoundError('Permission not found');
    }

    const isAssigned = await permissionsRepository.isAssignedToRoles(id);
    if (isAssigned) {
      throw new ValidationError('Cannot delete permission that is assigned to roles. Remove it from all roles first.');
    }

    await permissionsRepository.delete(id);
  }

  async bulkDelete(ids: string[]): Promise<number> {
    return permissionsRepository.bulkDelete(ids);
  }

  async getResources(): Promise<string[]> {
    return permissionsRepository.getDistinctResources();
  }
}

export const permissionsService = new PermissionsService();
