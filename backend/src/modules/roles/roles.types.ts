export interface RoleWithPermissions {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
  permissions: {
    id: string;
    resource: string;
    action: string;
    description: string | null;
  }[];
}

export interface RoleFilters {
  search?: string;
  name?: string;
  description?: string;
  isSystem?: string;
  sortBy?: 'name' | 'isSystem' | 'createdAt';
  sortDirection?: 'asc' | 'desc';
}

export interface PaginatedRoles {
  roles: RoleWithPermissions[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
