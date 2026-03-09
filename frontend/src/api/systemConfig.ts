import { apiClient } from './client';
import type { SystemConfig } from '@/types/system-config.types';

export const systemConfigApi = {
  async findAll(): Promise<SystemConfig[]> {
    const response = await apiClient.get('/system-config');
    return response.data.data;
  },

  async findByKey(key: string): Promise<SystemConfig> {
    const response = await apiClient.get(`/system-config/${key}`);
    return response.data.data;
  },

  async upsert(data: { key: string; value: string; label?: string; group?: string }): Promise<SystemConfig> {
    const response = await apiClient.put('/system-config', data);
    return response.data.data;
  },

  async delete(key: string): Promise<void> {
    await apiClient.delete(`/system-config/${key}`);
  },
};
