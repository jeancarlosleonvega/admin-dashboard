import { apiClient } from './client';
import type { MembershipPlan, MembershipPlanFilters } from '@/types/membership-plan.types';

interface PaginatedResponse {
  data: MembershipPlan[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

type MembershipPlanInput = {
  name: string;
  description?: string;
  price: number;
  baseBookingPrice?: number;
  monthlyReservationLimit?: number | null;
  sportTypeId?: string | null;
  walletCreditEnabled?: boolean;
  walletCreditAmount?: number | null;
  walletPaymentEnabled?: boolean;
  active?: boolean;
};

export const membershipPlansApi = {
  async findAll(filters?: MembershipPlanFilters): Promise<PaginatedResponse> {
    const response = await apiClient.get('/membership-plans', { params: filters });
    return { data: response.data.data, meta: response.data.meta };
  },

  async findById(id: string): Promise<MembershipPlan> {
    const response = await apiClient.get(`/membership-plans/${id}`);
    return response.data.data;
  },

  async create(data: MembershipPlanInput): Promise<MembershipPlan> {
    const response = await apiClient.post('/membership-plans', data);
    return response.data.data;
  },

  async update(id: string, data: Partial<MembershipPlanInput>): Promise<MembershipPlan> {
    const response = await apiClient.put(`/membership-plans/${id}`, data);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/membership-plans/${id}`);
  },
};
