export interface SportType {
  id: string;
  name: string;
  description: string | null;
  defaultIntervalMinutes: number;
  defaultPlayersPerSlot: number;
  defaultOpenTime: string;
  defaultCloseTime: string;
  defaultEnabledDays: number[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SportTypeFilters {
  search?: string;
  active?: 'true' | 'false';
  page?: number;
  limit?: number;
}
