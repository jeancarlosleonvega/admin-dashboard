import { useQuery } from '@tanstack/react-query';
import { slotsApi } from '@api/slots.api';

export const slotKeys = {
  all: ['slots'] as const,
  byVenueDate: (venueId: string, date: string, scheduleId?: string) => [...slotKeys.all, venueId, date, scheduleId] as const,
  availability: (venueId: string, startDate: string, endDate: string, scheduleId?: string, openTime?: string, closeTime?: string) =>
    [...slotKeys.all, 'availability', venueId, startDate, endDate, scheduleId, openTime, closeTime] as const,
  search: (params: { startDate: string; endDate?: string; venueId?: string; startTime?: string; endTime?: string; numPlayers?: number }) =>
    [...slotKeys.all, 'search', params] as const,
};

export function useSlots(venueId: string, date: string, scheduleId?: string) {
  return useQuery({
    queryKey: slotKeys.byVenueDate(venueId, date, scheduleId),
    queryFn: () => slotsApi.getSlots(venueId, date, scheduleId),
    enabled: !!venueId && !!date,
  });
}

export function useSearchSlots(
  params: { startDate: string; endDate?: string; venueId?: string; startTime?: string; endTime?: string; numPlayers?: number },
  enabled: boolean,
) {
  return useQuery({
    queryKey: slotKeys.search(params),
    queryFn: () => slotsApi.searchAvailable(params),
    enabled,
  });
}

export function useSlotAvailability(venueId: string, startDate: string, endDate: string, scheduleId?: string, openTime?: string, closeTime?: string) {
  return useQuery({
    queryKey: slotKeys.availability(venueId, startDate, endDate, scheduleId, openTime, closeTime),
    queryFn: () => slotsApi.getAvailability(venueId, startDate, endDate, scheduleId, openTime, closeTime),
    enabled: !!venueId && !!startDate && !!endDate,
  });
}
