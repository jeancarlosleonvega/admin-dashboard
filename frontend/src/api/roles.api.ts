import { apiClient } from './client';
import type {
  Permission,
  RoleWithPermissions,
  CreateRoleInput,
  UpdateRoleInput,
  RoleFilters,
  CreatePermissionInput,
  UpdatePermissionInput,
  PermissionFilters,
} from '@/types/role.types';

interface PaginatedResponse<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

// Roles API
export const rolesApi = {
  async getRoles(filters?: RoleFilters): Promise<PaginatedResponse<RoleWithPermissions>> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.name) params.append('name', filters.name);
    if (filters?.description) params.append('description', filters.description);
    if (filters?.isSystem) params.append('isSystem', filters.isSystem);
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortDirection) params.append('sortDirection', filters.sortDirection);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get(`/roles?${params.toString()}`);
    return { data: response.data.data, meta: response.data.meta };
  },

  async getRole(id: string): Promise<RoleWithPermissions> {
    const response = await apiClient.get(`/roles/${id}`);
    return response.data.data;
  },

  async getRolesList(): Promise<RoleWithPermissions[]> {
    const response = await apiClient.get('/roles?limit=100');
    return response.data.data;
  },

  async createRole(data: CreateRoleInput): Promise<RoleWithPermissions> {
    const response = await apiClient.post('/roles', data);
    return response.data.data;
  },

  async updateRole(id: string, data: UpdateRoleInput): Promise<RoleWithPermissions> {
    const response = await apiClient.put(`/roles/${id}`, data);
    return response.data.data;
  },

  async deleteRole(id: string): Promise<void> {
    await apiClient.delete(`/roles/${id}`);
  },

  async bulkDeleteRoles(ids: string[]): Promise<void> {
    await apiClient.post('/roles/bulk-delete', { ids });
  },
};

// Permissions API
export const permissionsApi = {
  async getPermissions(filters?: PermissionFilters): Promise<PaginatedResponse<Permission>> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.resource) params.append('resource', filters.resource);
    if (filters?.action) params.append('action', filters.action);
    if (filters?.description) params.append('description', filters.description);
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortDirection) params.append('sortDirection', filters.sortDirection);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get(`/permissions?${params.toString()}`);
    return { data: response.data.data, meta: response.data.meta };
  },

  async getPermission(id: string): Promise<Permission> {
    const response = await apiClient.get(`/permissions/${id}`);
    return response.data.data;
  },

  async getAllPermissions(): Promise<Permission[]> {
    const response = await apiClient.get('/permissions?limit=100');
    return response.data.data;
  },

  async getResources(): Promise<string[]> {
    const response = await apiClient.get('/permissions/resources');
    return response.data.data;
  },

  async createPermission(data: CreatePermissionInput): Promise<Permission> {
    const response = await apiClient.post('/permissions', data);
    return response.data.data;
  },

  async updatePermission(id: string, data: UpdatePermissionInput): Promise<Permission> {
    const response = await apiClient.put(`/permissions/${id}`, data);
    return response.data.data;
  },

  async deletePermission(id: string): Promise<void> {
    await apiClient.delete(`/permissions/${id}`);
  },

  async bulkDeletePermissions(ids: string[]): Promise<void> {
    await apiClient.post('/permissions/bulk-delete', { ids });
  },
};
