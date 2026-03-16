import { apiClient } from './client';
import type { SlotAvailability, DayAvailability } from '@/types/venue-schedule.types';

export const slotsApi = {
  async getSlots(venueId: string, date: string, scheduleId?: string): Promise<SlotAvailability[]> {
    const query = new URLSearchParams({ venueId, date });
    if (scheduleId) query.set('scheduleId', scheduleId);
    const response = await apiClient.get(`/slots?${query.toString()}`);
    return response.data.data;
  },

  async getAvailability(venueId: string, startDate: string, endDate: string, scheduleId?: string, openTime?: string, closeTime?: string): Promise<DayAvailability[]> {
    const query = new URLSearchParams({ venueId, startDate, endDate });
    if (scheduleId) query.set('scheduleId', scheduleId);
    if (openTime) query.set('openTime', openTime);
    if (closeTime) query.set('closeTime', closeTime);
    const response = await apiClient.get(`/slots/availability?${query.toString()}`);
    return response.data.data;
  },

  async searchAvailable(params: { startDate: string; endDate?: string; venueId?: string; startTime?: string; endTime?: string; numPlayers?: number }): Promise<SlotAvailability[]> {
    const query = new URLSearchParams({ startDate: params.startDate });
    if (params.endDate) query.set('endDate', params.endDate);
    if (params.venueId) query.set('venueId', params.venueId);
    if (params.numPlayers) query.set('numPlayers', String(params.numPlayers));
    if (params.startTime) query.set('startTime', params.startTime);
    if (params.endTime) query.set('endTime', params.endTime);
    const response = await apiClient.get(`/slots/search?${query.toString()}`);
    return response.data.data;
  },
};
