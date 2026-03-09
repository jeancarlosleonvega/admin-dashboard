import { apiClient } from './client';

export interface BlockedPeriod {
  id: string;
  sportTypeId?: string | null;
  venueId?: string | null;
  startDate: string;
  endDate: string;
  startTime?: string | null;
  endTime?: string | null;
  reason?: string | null;
  active: boolean;
  createdAt: string;
  sportType?: { id: string; name: string } | null;
  venue?: { id: string; name: string } | null;
}

interface PaginatedResponse {
  data: BlockedPeriod[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export const blockedPeriodsApi = {
  async getBlockedPeriods(filters?: {
    sportTypeId?: string;
    venueId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse> {
    const params = new URLSearchParams();
    if (filters?.sportTypeId) params.append('sportTypeId', filters.sportTypeId);
    if (filters?.venueId) params.append('venueId', filters.venueId);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    const response = await apiClient.get(`/blocked-periods?${params.toString()}`);
    return { data: response.data.data, meta: response.data.meta };
  },

  async getBlockedPeriod(id: string): Promise<BlockedPeriod> {
    const response = await apiClient.get(`/blocked-periods/${id}`);
    return response.data.data;
  },

  async createBlockedPeriod(data: {
    sportTypeId?: string | null;
    venueId?: string | null;
    startDate: string;
    endDate: string;
    startTime?: string | null;
    endTime?: string | null;
    reason?: string;
    active?: boolean;
  }): Promise<BlockedPeriod> {
    const response = await apiClient.post('/blocked-periods', data);
    return response.data.data;
  },

  async updateBlockedPeriod(id: string, data: Partial<{
    sportTypeId: string | null;
    venueId: string | null;
    startDate: string;
    endDate: string;
    startTime: string | null;
    endTime: string | null;
    reason: string;
    active: boolean;
  }>): Promise<BlockedPeriod> {
    const response = await apiClient.put(`/blocked-periods/${id}`, data);
    return response.data.data;
  },

  async deleteBlockedPeriod(id: string): Promise<void> {
    await apiClient.delete(`/blocked-periods/${id}`);
  },
};
