import { apiClient } from './client';

export interface RevenueFactorType {
  id: string;
  name: string;
  key: string;
  valueType: 'NUMBER_RANGE' | 'TIME_RANGE' | 'ENUM';
  enumValues: string[];
  enumLabels: string[];
  description?: string;
  isSystem: boolean;
  active: boolean;
}

export interface RevenueFactorRule {
  minValue?: string | null;
  maxValue?: string | null;
  enumValue?: string | null;
  multiplier: number;
  label?: string | null;
}

export interface RevenueFactor {
  factorTypeId: string;
  enabled: boolean;
  factorType: RevenueFactorType;
  rules: RevenueFactorRule[];
}

export interface RevenueFactorInput {
  factorTypeId: string;
  enabled: boolean;
  rules: RevenueFactorRule[];
}

export interface RevenueConfigInput {
  enabled: boolean;
  minPrice: number;
  maxPrice: number;
  roundingStep: number;
  factors: RevenueFactorInput[];
}

export interface RevenueConfig {
  id: string;
  sportTypeId: string;
  enabled: boolean;
  minPrice: number;
  maxPrice: number;
  roundingStep: number;
  factors: RevenueFactor[];
}

export interface RevenueSportTypeConfig {
  sportType: { id: string; name: string };
  config: RevenueConfig;
}

export const revenueApi = {
  async getFactorTypes(): Promise<RevenueFactorType[]> {
    const res = await apiClient.get('/revenue/factor-types');
    return res.data.data;
  },
  async createFactorType(data: Omit<RevenueFactorType, 'id' | 'active' | 'isSystem'>): Promise<RevenueFactorType> {
    const res = await apiClient.post('/revenue/factor-types', data);
    return res.data.data;
  },
  async updateFactorType(id: string, data: { name?: string; description?: string | null; enumValues?: string[]; enumLabels?: string[] }): Promise<RevenueFactorType> {
    const res = await apiClient.patch(`/revenue/factor-types/${id}`, data);
    return res.data.data;
  },
  async deleteFactorType(id: string): Promise<void> {
    await apiClient.delete(`/revenue/factor-types/${id}`);
  },
  async getAll(): Promise<RevenueSportTypeConfig[]> {
    const res = await apiClient.get('/revenue');
    return res.data.data;
  },
  async upsert(sportTypeId: string, data: RevenueConfigInput): Promise<RevenueSportTypeConfig> {
    const res = await apiClient.put(`/revenue/${sportTypeId}`, data);
    return res.data.data;
  },
};
