import { apiClient } from './client';
import type {
  UserWithRoles,
  CreateUserInput,
  UpdateUserInput,
  UserFilters,
} from '@/types/user.types';

interface PaginatedResponse {
  data: UserWithRoles[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const usersApi = {
  async getUsers(filters?: UserFilters): Promise<PaginatedResponse> {
    const params = new URLSearchParams();

    if (filters?.search) params.append('search', filters.search);
    if (filters?.firstName) params.append('firstName', filters.firstName);
    if (filters?.lastName) params.append('lastName', filters.lastName);
    if (filters?.email) params.append('email', filters.email);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.roleId) params.append('roleId', filters.roleId);
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortDirection) params.append('sortDirection', filters.sortDirection);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get(`/users?${params.toString()}`);
    return { data: response.data.data, meta: response.data.meta };
  },

  async getUser(id: string): Promise<UserWithRoles> {
    const response = await apiClient.get(`/users/${id}`);
    return response.data.data;
  },

  async createUser(data: CreateUserInput): Promise<UserWithRoles> {
    const response = await apiClient.post('/users', data);
    return response.data.data;
  },

  async updateUser(id: string, data: UpdateUserInput): Promise<UserWithRoles> {
    const response = await apiClient.put(`/users/${id}`, data);
    return response.data.data;
  },

  async deleteUser(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}`);
  },
};

