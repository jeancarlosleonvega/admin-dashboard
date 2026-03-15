import { apiClient } from './client';

export interface PaymentWithBooking {
  id: string;
  bookingId: string;
  method: string;
  status: string;
  amount: number;
  transferProofUrl?: string | null;
  transferProofUploadedAt?: string | null;
  expiresAt?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  booking: {
    id: string;
    status: string;
    user: { id: string; firstName: string; lastName: string; email: string };
    slot: {
      date: string;
      startTime: string;
      endTime: string;
      venue: { id: string; name: string; sportType: { id: string; name: string } };
    };
  };
}

export const paymentsApi = {
  async getAll(method?: string): Promise<PaymentWithBooking[]> {
    const params = method ? { method } : undefined;
    const response = await apiClient.get('/payments', { params });
    return response.data.data;
  },

  async getPendingTransfers(): Promise<PaymentWithBooking[]> {
    const response = await apiClient.get('/payments/pending-transfers');
    return response.data.data;
  },

  async uploadTransferProof(id: string, proofUrl: string): Promise<PaymentWithBooking> {
    const response = await apiClient.post(`/payments/${id}/transfer-proof`, { proofUrl });
    return response.data.data;
  },

  async validateTransfer(id: string, data: { approved: boolean; reason?: string }): Promise<PaymentWithBooking> {
    const response = await apiClient.put(`/payments/${id}/validate`, data);
    return response.data.data;
  },

  async getMy(): Promise<PaymentWithBooking[]> {
    const response = await apiClient.get('/payments/my');
    return response.data.data;
  },
};
