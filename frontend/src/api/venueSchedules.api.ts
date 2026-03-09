import { apiClient } from './client';
import type { VenueSchedule } from '@/types/venue-schedule.types';

interface PaginatedResponse {
  data: VenueSchedule[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export const venueSchedulesApi = {
  async getVenueSchedules(filters?: { venueId?: string; page?: number; limit?: number }): Promise<PaginatedResponse> {
    const params = new URLSearchParams();
    if (filters?.venueId) params.append('venueId', filters.venueId);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    const response = await apiClient.get(`/venue-schedules?${params.toString()}`);
    return { data: response.data.data, meta: response.data.meta };
  },

  async getVenueSchedule(id: string): Promise<VenueSchedule> {
    const response = await apiClient.get(`/venue-schedules/${id}`);
    return response.data.data;
  },

  async createVenueSchedule(data: {
    venueId: string;
    name: string;
    startDate: string;
    endDate?: string | null;
    daysOfWeek: number[];
    openTime?: string | null;
    closeTime?: string | null;
    intervalMinutes?: number | null;
    active?: boolean;
  }): Promise<VenueSchedule> {
    const response = await apiClient.post('/venue-schedules', data);
    return response.data.data;
  },

  async updateVenueSchedule(id: string, data: Partial<{
    venueId: string;
    name: string;
    startDate: string;
    endDate: string | null;
    daysOfWeek: number[];
    openTime: string | null;
    closeTime: string | null;
    intervalMinutes: number | null;
    active: boolean;
  }>): Promise<VenueSchedule> {
    const response = await apiClient.put(`/venue-schedules/${id}`, data);
    return response.data.data;
  },

  async deleteVenueSchedule(id: string): Promise<void> {
    await apiClient.delete(`/venue-schedules/${id}`);
  },

  async generateSlots(id: string, until: string): Promise<VenueSchedule> {
    const response = await apiClient.post(`/venue-schedules/${id}/generate-slots`, { until });
    return response.data.data;
  },
};
