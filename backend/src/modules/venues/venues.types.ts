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
  createdAt: Date;
  updatedAt: Date;
}

export interface VenueWithSportType extends Venue {
  sportType: {
    id: string;
    name: string;
  };
  operatingHours: VenueOperatingHours[];
}
