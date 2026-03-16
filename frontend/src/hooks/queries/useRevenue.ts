import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { revenueApi } from '@api/revenue.api';
import { slotKeys } from './useSlots';
import type { RevenueConfigInput, RevenueFactorType } from '@api/revenue.api';

export const revenueKeys = {
  all: ['revenue'] as const,
  factorTypes: ['revenue', 'factor-types'] as const,
};

export function useRevenue() {
  return useQuery({ queryKey: revenueKeys.all, queryFn: () => revenueApi.getAll() });
}

export function useRevenueFactorTypes() {
  return useQuery({ queryKey: revenueKeys.factorTypes, queryFn: () => revenueApi.getFactorTypes() });
}

export function useCreateFactorType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<RevenueFactorType, 'id' | 'active' | 'isSystem'>) => revenueApi.createFactorType(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: revenueKeys.factorTypes }),
  });
}

export function useUpdateFactorType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; description?: string | null; enumValues?: string[]; enumLabels?: string[] } }) =>
      revenueApi.updateFactorType(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: revenueKeys.factorTypes }),
  });
}

export function useDeleteFactorType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => revenueApi.deleteFactorType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: revenueKeys.factorTypes });
      queryClient.invalidateQueries({ queryKey: revenueKeys.all });
      queryClient.removeQueries({ queryKey: slotKeys.all });
    },
  });
}

export function useUpsertRevenue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sportTypeId, data }: { sportTypeId: string; data: RevenueConfigInput }) =>
      revenueApi.upsert(sportTypeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: revenueKeys.all });
      queryClient.removeQueries({ queryKey: slotKeys.all });
    },
  });
}
