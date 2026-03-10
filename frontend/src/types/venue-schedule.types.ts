export interface VenueSchedule {
  id: string;
  venueId: string;
  name: string;
  startDate: string;
  endDate?: string | null;
  daysOfWeek: number[];
  openTime?: string | null;
  closeTime?: string | null;
  intervalMinutes?: number | null;
  playersPerSlot?: number | null;
  generatedUntil?: string | null;
  active: boolean;
  createdAt: string;
  venue?: { id: string; name: string; playersPerSlot?: number | null; sportType: { id: string; name: string; defaultPlayersPerSlot?: number } };
}

export interface SlotAvailability {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'AVAILABLE' | 'BOOKED' | 'BLOCKED';
  venueId?: string;
  venue?: {
    id: string;
    name: string;
    playersPerSlot?: number | null;
    sportType: { id: string; name: string; defaultPlayersPerSlot?: number };
  };
}

export interface DayAvailability {
  date: string;
  availableSlots: number;
}
