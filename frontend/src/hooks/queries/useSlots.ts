import { useQuery } from '@tanstack/react-query';
import { slotsApi } from '@api/slots.api';

export const slotKeys = {
  all: ['slots'] as const,
  byVenueDate: (venueId: string, date: string) => [...slotKeys.all, venueId, date] as const,
  availability: (venueId: string, startDate: string, endDate: string) =>
    [...slotKeys.all, 'availability', venueId, startDate, endDate] as const,
};

export function useSlots(venueId: string, date: string) {
  return useQuery({
    queryKey: slotKeys.byVenueDate(venueId, date),
    queryFn: () => slotsApi.getSlots(venueId, date),
    enabled: !!venueId && !!date,
  });
}

export function useSlotAvailability(venueId: string, startDate: string, endDate: string) {
  return useQuery({
    queryKey: slotKeys.availability(venueId, startDate, endDate),
    queryFn: () => slotsApi.getAvailability(venueId, startDate, endDate),
    enabled: !!venueId && !!startDate && !!endDate,
  });
}
