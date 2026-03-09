import { apiClient } from './client';
import type { AdditionalService } from '@/types/additional-service.types';

interface PaginatedResponse {
  data: AdditionalService[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export const additionalServicesApi = {
  async getAdditionalServices(filters?: {
    sportTypeId?: string;
    active?: boolean;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse> {
    const params = new URLSearchParams();
    if (filters?.sportTypeId) params.append('sportTypeId', filters.sportTypeId);
    if (filters?.active !== undefined) params.append('active', filters.active.toString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    const response = await apiClient.get(`/additional-services?${params.toString()}`);
    return { data: response.data.data, meta: response.data.meta };
  },

  async getAdditionalService(id: string): Promise<AdditionalService> {
    const response = await apiClient.get(`/additional-services/${id}`);
    return response.data.data;
  },

  async createAdditionalService(data: {
    sportTypeId?: string | null;
    name: string;
    description?: string;
    price: number;
    active?: boolean;
  }): Promise<AdditionalService> {
    const response = await apiClient.post('/additional-services', data);
    return response.data.data;
  },

  async updateAdditionalService(id: string, data: Partial<{
    sportTypeId: string | null;
    name: string;
    description: string;
    price: number;
    active: boolean;
  }>): Promise<AdditionalService> {
    const response = await apiClient.put(`/additional-services/${id}`, data);
    return response.data.data;
  },

  async deleteAdditionalService(id: string): Promise<void> {
    await apiClient.delete(`/additional-services/${id}`);
  },
};
