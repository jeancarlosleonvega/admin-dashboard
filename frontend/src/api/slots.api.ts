import { apiClient } from './client';
import type { SlotAvailability, DayAvailability } from '@/types/venue-schedule.types';

export const slotsApi = {
  async getSlots(venueId: string, date: string): Promise<SlotAvailability[]> {
    const response = await apiClient.get(`/slots?venueId=${venueId}&date=${date}`);
    return response.data.data;
  },

  async getAvailability(venueId: string, startDate: string, endDate: string): Promise<DayAvailability[]> {
    const response = await apiClient.get(
      `/slots/availability?venueId=${venueId}&startDate=${startDate}&endDate=${endDate}`
    );
    return response.data.data;
  },

  async searchAvailable(params: { date: string; venueId?: string; startTime?: string; endTime?: string }): Promise<SlotAvailability[]> {
    const query = new URLSearchParams({ date: params.date });
    if (params.venueId) query.set('venueId', params.venueId);
    if (params.startTime) query.set('startTime', params.startTime);
    if (params.endTime) query.set('endTime', params.endTime);
    const response = await apiClient.get(`/slots/search?${query.toString()}`);
    return response.data.data;
  },
};
