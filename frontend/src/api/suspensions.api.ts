import { apiClient } from './client';

export interface UserSuspension {
  id: string;
  userId: string;
  reason: string;
  startDate: string;
  endDate: string | null;
  isAutomatic: boolean;
  liftedAt: string | null;
  liftedById: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: { firstName: string; lastName: string };
  liftedBy?: { firstName: string; lastName: string } | null;
}

export interface CreateSuspensionInput {
  userId: string;
  reason: string;
  startDate: string;
  endDate?: string;
}

export const suspensionsApi = {
  async getSuspensions(userId: string): Promise<UserSuspension[]> {
    const response = await apiClient.get(`/user-suspensions?userId=${userId}`);
    return response.data.data;
  },

  async createSuspension(data: CreateSuspensionInput): Promise<UserSuspension> {
    const response = await apiClient.post('/user-suspensions', data);
    return response.data.data;
  },

  async liftSuspension(id: string): Promise<UserSuspension> {
    const response = await apiClient.delete(`/user-suspensions/${id}`);
    return response.data.data;
  },
};
