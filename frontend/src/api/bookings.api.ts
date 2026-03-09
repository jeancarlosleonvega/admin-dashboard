import { apiClient } from './client';
import type { Booking, CreateBookingInput } from '@/types/booking.types';

interface PaginatedResponse {
  data: Booking[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export const bookingsApi = {
  async getMyBookings(filters?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    const response = await apiClient.get(`/bookings/my?${params.toString()}`);
    return { data: response.data.data, meta: response.data.meta };
  },

  async getBookings(filters?: {
    userId?: string;
    venueId?: string;
    status?: string;
    date?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse> {
    const params = new URLSearchParams();
    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.venueId) params.append('venueId', filters.venueId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.date) params.append('date', filters.date);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    const response = await apiClient.get(`/bookings?${params.toString()}`);
    return { data: response.data.data, meta: response.data.meta };
  },

  async getBooking(id: string): Promise<Booking> {
    const response = await apiClient.get(`/bookings/${id}`);
    return response.data.data;
  },

  async createBooking(data: CreateBookingInput): Promise<Booking> {
    const response = await apiClient.post('/bookings', data);
    return response.data.data;
  },

  async cancelBooking(id: string): Promise<void> {
    await apiClient.delete(`/bookings/${id}`);
  },
};
