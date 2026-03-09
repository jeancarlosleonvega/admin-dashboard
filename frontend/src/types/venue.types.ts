export interface Venue {
  id: string;
  sportTypeId: string;
  name: string;
  description: string | null;
  intervalMinutes: number;
  playersPerSlot: number;
  openTime: string;
  closeTime: string;
  enabledDays: number[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
  sportType: {
    id: string;
    name: string;
    defaultIntervalMinutes: number;
    defaultPlayersPerSlot: number;
    defaultOpenTime: string;
    defaultCloseTime: string;
    defaultEnabledDays: number[];
  };
}

export interface VenueFilters {
  search?: string;
  sportTypeId?: string;
  active?: 'true' | 'false';
  page?: number;
  limit?: number;
}
