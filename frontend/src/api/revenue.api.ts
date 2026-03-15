import { apiClient } from './client';

export interface RevenueTimeRule {
  id?: string;
  label?: string;
  startTime: string;
  endTime: string;
  multiplier: number;
}

export interface RevenueDayRule {
  id?: string;
  dayType: 'WEEKDAY' | 'FRIDAY' | 'WEEKEND' | 'HOLIDAY';
  multiplier: number;
  label?: string;
}

export interface RevenueOccupancyRule {
  id?: string;
  minOccupancy: number;
  maxOccupancy: number;
  multiplier: number;
}

export interface RevenueConfig {
  id: string;
  sportTypeId: string;
  enabled: boolean;
  minPrice: number;
  maxPrice: number;
  roundingStep: number;
  timeRules: RevenueTimeRule[];
  dayRules: RevenueDayRule[];
  occupancyRules: RevenueOccupancyRule[];
}

export interface RevenueSportTypeConfig {
  sportType: { id: string; name: string };
  config: RevenueConfig;
}

export const revenueApi = {
  async getAll(): Promise<RevenueSportTypeConfig[]> {
    const res = await apiClient.get('/revenue');
    return res.data.data;
  },
  async upsert(sportTypeId: string, data: Omit<RevenueConfig, 'id' | 'sportTypeId'>): Promise<RevenueSportTypeConfig> {
    const res = await apiClient.put(`/revenue/${sportTypeId}`, data);
    return res.data.data;
  },
};
