import { User, UserStatus } from '@prisma/client';

export type SafeUser = Omit<User, 'passwordHash' | 'tokenVersion'>;

export interface UserWithRoles extends SafeUser {
  roles: {
    id: string;
    name: string;
  }[];
}

export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleIds?: string[];
}

export interface UpdateUserDto {
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
  sortBy?: 'firstName' | 'email' | 'status' | 'createdAt';
  sortDirection?: 'asc' | 'desc';
}

export interface PaginatedUsers {
  users: UserWithRoles[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
