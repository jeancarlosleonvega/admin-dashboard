import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { venueSchedulesApi } from '@api/venueSchedules.api';
import { slotKeys } from './useSlots';

export const venueScheduleKeys = {
  all: ['venue-schedules'] as const,
  lists: () => [...venueScheduleKeys.all, 'list'] as const,
  list: (filters?: { venueId?: string; page?: number; limit?: number }) => [...venueScheduleKeys.lists(), filters] as const,
  detail: (id: string) => [...venueScheduleKeys.all, 'detail', id] as const,
};

export function useVenueSchedules(filters?: { venueId?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: venueScheduleKeys.list(filters),
    queryFn: () => venueSchedulesApi.getVenueSchedules(filters),
  });
}

export function useVenueSchedule(id: string) {
  return useQuery({
    queryKey: venueScheduleKeys.detail(id),
    queryFn: () => venueSchedulesApi.getVenueSchedule(id),
    enabled: !!id,
  });
}

export function useCreateVenueSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof venueSchedulesApi.createVenueSchedule>[0]) =>
      venueSchedulesApi.createVenueSchedule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: venueScheduleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: slotKeys.all });
    },
  });
}

export function useUpdateVenueSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof venueSchedulesApi.updateVenueSchedule>[1] }) =>
      venueSchedulesApi.updateVenueSchedule(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: venueScheduleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: venueScheduleKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: slotKeys.all });
    },
  });
}

export function useDeleteVenueSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => venueSchedulesApi.deleteVenueSchedule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: venueScheduleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: slotKeys.all });
    },
  });
}

export function useGenerateSlots() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, until }: { id: string; until: string }) =>
      venueSchedulesApi.generateSlots(id, until),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: venueScheduleKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: venueScheduleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: slotKeys.all });
    },
  });
}
