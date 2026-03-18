export interface VenueOperatingHours {
  id: string;
  venueId: string;
  daysOfWeek: number[];
  openTime: string;
  closeTime: string;
}

export interface Venue {
  id: string;
  sportTypeId: string;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  sportType: {
    id: string;
    name: string;
  };
  operatingHours: VenueOperatingHours[];
}

export interface VenueFilters {
  search?: string;
  sportTypeId?: string;
  active?: 'true' | 'false';
  page?: number;
  limit?: number;
}
