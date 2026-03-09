import { apiClient } from './client';
import type { SportType, SportTypeFilters } from '@/types/sport-type.types';

interface PaginatedResponse {
  data: SportType[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const sportTypesApi = {
  async findAll(filters?: SportTypeFilters): Promise<PaginatedResponse> {
    const response = await apiClient.get('/sport-types', { params: filters });
    return { data: response.data.data, meta: response.data.meta };
  },

  async findById(id: string): Promise<SportType> {
    const response = await apiClient.get(`/sport-types/${id}`);
    return response.data.data;
  },

  async create(data: Omit<SportType, 'id' | 'createdAt' | 'updatedAt'>): Promise<SportType> {
    const response = await apiClient.post('/sport-types', data);
    return response.data.data;
  },

  async update(id: string, data: Partial<Omit<SportType, 'id' | 'createdAt' | 'updatedAt'>>): Promise<SportType> {
    const response = await apiClient.put(`/sport-types/${id}`, data);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/sport-types/${id}`);
  },
};
