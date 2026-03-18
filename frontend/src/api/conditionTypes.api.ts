import { apiClient } from './client';

export interface AllowedValueItem {
  value: string;
  label: string;
}

export interface ConditionType {
  id: string;
  name: string;
  key: string;
  dataType: 'NUMBER' | 'STRING' | 'UUID' | 'ENUM';
  allowedOperators: string[];
  allowedValues: AllowedValueItem[] | null;
  isSystem: boolean;
  description: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ConditionTypeFilters {
  search?: string;
  active?: 'true' | 'false';
  dataType?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

interface PaginatedResponse {
  data: ConditionType[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export const conditionTypesApi = {
  async findAll(filters?: ConditionTypeFilters): Promise<PaginatedResponse> {
    const response = await apiClient.get('/condition-types', { params: filters });
    return { data: response.data.data, meta: response.data.meta };
  },

  async findById(id: string): Promise<ConditionType> {
    const response = await apiClient.get(`/condition-types/${id}`);
    return response.data.data;
  },

  async create(data: Omit<ConditionType, 'id' | 'createdAt' | 'updatedAt'>): Promise<ConditionType> {
    const response = await apiClient.post('/condition-types', data);
    return response.data.data;
  },

  async update(id: string, data: Partial<Omit<ConditionType, 'id' | 'key' | 'createdAt' | 'updatedAt'>>): Promise<ConditionType> {
    const response = await apiClient.put(`/condition-types/${id}`, data);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/condition-types/${id}`);
  },
};
