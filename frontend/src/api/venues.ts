import { apiClient } from './client';
import type { Venue, VenueFilters } from '@/types/venue.types';

interface PaginatedResponse {
  data: Venue[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

type VenueInput = {
  sportTypeId: string;
  name: string;
  description?: string;
  intervalMinutes?: number;
  playersPerSlot?: number;
  openTime?: string;
  closeTime?: string;
  enabledDays?: number[];
  active?: boolean;
};

export const venuesApi = {
  async findAll(filters?: VenueFilters): Promise<PaginatedResponse> {
    const response = await apiClient.get('/venues', { params: filters });
    return { data: response.data.data, meta: response.data.meta };
  },

  async findById(id: string): Promise<Venue> {
    const response = await apiClient.get(`/venues/${id}`);
    return response.data.data;
  },

  async create(data: VenueInput): Promise<Venue> {
    const response = await apiClient.post('/venues', data);
    return response.data.data;
  },

  async update(id: string, data: Partial<VenueInput>): Promise<Venue> {
    const response = await apiClient.put(`/venues/${id}`, data);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/venues/${id}`);
  },
};
