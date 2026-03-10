import { useQuery } from '@tanstack/react-query';
import { blockedPeriodsApi } from '@api/blockedPeriods.api';

export const blockedPeriodKeys = {
  all: ['blocked-periods'] as const,
  list: (filters?: object) => [...blockedPeriodKeys.all, 'list', filters] as const,
};

export function useBlockedPeriods(filters?: {
  venueId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: blockedPeriodKeys.list(filters),
    queryFn: () => blockedPeriodsApi.getBlockedPeriods({ ...filters, limit: filters?.limit ?? 100 }),
    enabled: !!(filters?.startDate),
  });
}
