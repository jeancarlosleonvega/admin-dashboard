import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sportTypesApi } from '@api/sportTypes';
import type { SportTypeFilters } from '@/types/sport-type.types';
import { revenueKeys } from './useRevenue';

export const sportTypeKeys = {
  all: ['sport-types'] as const,
  lists: () => [...sportTypeKeys.all, 'list'] as const,
  list: (filters: SportTypeFilters) => [...sportTypeKeys.lists(), filters] as const,
  details: () => [...sportTypeKeys.all, 'detail'] as const,
  detail: (id: string) => [...sportTypeKeys.details(), id] as const,
};

export function useSportTypes(filters: SportTypeFilters = {}) {
  return useQuery({
    queryKey: sportTypeKeys.list(filters),
    queryFn: () => sportTypesApi.findAll(filters),
  });
}

export function useSportType(id: string) {
  return useQuery({
    queryKey: sportTypeKeys.detail(id),
    queryFn: () => sportTypesApi.findById(id),
    enabled: !!id,
  });
}

export function useCreateSportType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof sportTypesApi.create>[0]) => sportTypesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sportTypeKeys.lists() });
    },
  });
}

export function useUpdateSportType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof sportTypesApi.update>[1] }) =>
      sportTypesApi.update(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: sportTypeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: sportTypeKeys.detail(variables.id) });
    },
  });
}

export function useDeleteSportType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => sportTypesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sportTypeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: revenueKeys.all });
    },
  });
}
