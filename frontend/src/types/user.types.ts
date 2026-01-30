export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
}

export interface UserWithRoles extends User {
  roles: Role[];
}

export interface CreateUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleIds?: string[];
}

export interface UpdateUserInput {
  email?: string;
  firstName?: string;
  lastName?: string;
  status?: UserStatus;
  roleIds?: string[];
}

export interface UserFilters {
  search?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  status?: UserStatus;
  roleId?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PaginatedUsers {
  users: UserWithRoles[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
