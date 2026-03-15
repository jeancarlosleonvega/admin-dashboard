import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { revenueApi } from '@api/revenue.api';
import type { RevenueConfig } from '@api/revenue.api';

export const revenueKeys = { all: ['revenue'] as const };

export function useRevenue() {
  return useQuery({ queryKey: revenueKeys.all, queryFn: () => revenueApi.getAll() });
}

export function useUpsertRevenue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sportTypeId, data }: { sportTypeId: string; data: Omit<RevenueConfig, 'id' | 'sportTypeId'> }) =>
      revenueApi.upsert(sportTypeId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: revenueKeys.all }),
  });
}
