export interface PermissionRecord {
  id: string;
  resource: string;
  action: string;
  description: string | null;
  createdAt: Date;
}

export interface PermissionFilters {
  search?: string;
  resource?: string;
  action?: string;
  description?: string;
  sortBy?: 'resource' | 'action' | 'createdAt';
  sortDirection?: 'asc' | 'desc';
}

export interface PaginatedPermissions {
  permissions: PermissionRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
