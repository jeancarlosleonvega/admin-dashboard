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
};
