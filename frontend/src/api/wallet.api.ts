import { apiClient } from './client';

export interface WalletInfo {
  balance: number;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  description: string | null;
  referenceType: string | null;
  referenceId: string | null;
  createdAt: string;
}

export const walletApi = {
  async getMyWallet(): Promise<WalletInfo> {
    const response = await apiClient.get('/wallet/me');
    return response.data.data;
  },

  async getMyTransactions(page = 1, limit = 20): Promise<{ data: WalletTransaction[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
    const response = await apiClient.get('/wallet/me/transactions', { params: { page, limit } });
    return { data: response.data.data, meta: response.data.meta };
  },
};
