export interface Venue {
  id: string;
  sportTypeId: string;
  name: string;
  description: string | null;
  intervalMinutes: number | null;
  playersPerSlot: number | null;
  openTime: string | null;
  closeTime: string | null;
  enabledDays: number[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface VenueWithSportType extends Venue {
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

// Resolved venue: nulls replaced with SportType defaults
export interface ResolvedVenue extends Omit<Venue, 'intervalMinutes' | 'playersPerSlot' | 'openTime' | 'closeTime' | 'enabledDays'> {
  intervalMinutes: number;
  playersPerSlot: number;
  openTime: string;
  closeTime: string;
  enabledDays: number[];
  sportType: VenueWithSportType['sportType'];
}
