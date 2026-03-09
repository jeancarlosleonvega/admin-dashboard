import { apiClient } from './client';

export interface QRValidationResult {
  valid: boolean;
  booking: {
    id: string;
    user: { id: string; firstName: string; lastName: string };
    slot: {
      date: string;
      startTime: string;
      endTime: string;
      venue: { id: string; name: string };
    };
    services: { id: string; name: string }[];
  };
}

export const qrApi = {
  async validateQR(code: string): Promise<QRValidationResult> {
    const response = await apiClient.get(`/qr/${encodeURIComponent(code)}`);
    return response.data.data;
  },
};
