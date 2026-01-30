export interface Permission {
  id: string;
  resource: string;
  action: string;
  description: string | null;
  createdAt: string;
}

export interface RoleWithPermissions {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
  permissions: Permission[];
}

export interface CreateRoleInput {
  name: string;
  description?: string;
  permissionIds?: string[];
}

export interface UpdateRoleInput {
  name?: string;
  description?: string | null;
  permissionIds?: string[];
}

export interface RoleFilters {
  search?: string;
  name?: string;
  description?: string;
  isSystem?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CreatePermissionInput {
  resource: string;
  action: string;
  description?: string;
}

export interface UpdatePermissionInput {
  resource?: string;
  action?: string;
  description?: string | null;
}

export interface PermissionFilters {
  search?: string;
  resource?: string;
  action?: string;
  description?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
