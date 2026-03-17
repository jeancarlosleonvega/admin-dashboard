import { apiClient } from './client';
import type { SlotAvailability, DayAvailability } from '@/types/venue-schedule.types';

export interface AgendaColumn {
  venueId: string;
  venueName: string;
}

export interface AgendaSlot {
  id: string;
  venueId: string;
  startTime: string;
  endTime: string;
  status: string;
  scheduleName: string | null;
  conditions: string | null;
  booking: { id: string; userName: string; numPlayers: number } | null;
}

export interface AgendaData {
  columns: AgendaColumn[];
  hours: string[];
  slots: AgendaSlot[];
}

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

  async getAgenda(date: string): Promise<AgendaData> {
    const response = await apiClient.get(`/slots/agenda?date=${date}`);
    return response.data.data;
  },

  async getAgendaMonthAvailability(startDate: string, endDate: string): Promise<{ date: string; available: number; booked: number; blocked: number }[]> {
    const response = await apiClient.get(`/slots/agenda-availability?startDate=${startDate}&endDate=${endDate}`);
    return response.data.data;
  },
};
