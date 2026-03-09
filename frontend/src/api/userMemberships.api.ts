import { apiClient } from './client';
import type { UserMembership } from '@/types/user-membership.types';

interface PaginatedResponse {
  data: UserMembership[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export const userMembershipsApi = {
  async getUserMemberships(filters?: { userId?: string; page?: number; limit?: number }): Promise<PaginatedResponse> {
    const params = new URLSearchParams();
    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    const response = await apiClient.get(`/user-memberships?${params.toString()}`);
    return { data: response.data.data, meta: response.data.meta };
  },

  async getMyMembership(): Promise<UserMembership | null> {
    const response = await apiClient.get('/user-memberships/my');
    return response.data.data;
  },

  async getUserMembership(id: string): Promise<UserMembership> {
    const response = await apiClient.get(`/user-memberships/${id}`);
    return response.data.data;
  },

  async createUserMembership(data: {
    userId: string;
    membershipPlanId: string;
    startDate: string;
    endDate?: string;
    notes?: string;
  }): Promise<UserMembership> {
    const response = await apiClient.post('/user-memberships', data);
    return response.data.data;
  },

  async updateUserMembership(
    id: string,
    data: { status?: string; endDate?: string | null; notes?: string }
  ): Promise<UserMembership> {
    const response = await apiClient.put(`/user-memberships/${id}`, data);
    return response.data.data;
  },

  async deleteUserMembership(id: string): Promise<void> {
    await apiClient.delete(`/user-memberships/${id}`);
  },
};
