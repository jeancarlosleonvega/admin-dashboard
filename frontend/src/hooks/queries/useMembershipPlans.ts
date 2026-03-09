import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { membershipPlansApi } from '@api/membershipPlans';
import type { MembershipPlanFilters } from '@/types/membership-plan.types';

export const membershipPlanKeys = {
  all: ['membership-plans'] as const,
  lists: () => [...membershipPlanKeys.all, 'list'] as const,
  list: (filters: MembershipPlanFilters) => [...membershipPlanKeys.lists(), filters] as const,
  details: () => [...membershipPlanKeys.all, 'detail'] as const,
  detail: (id: string) => [...membershipPlanKeys.details(), id] as const,
};

export function useMembershipPlans(filters: MembershipPlanFilters = {}) {
  return useQuery({
    queryKey: membershipPlanKeys.list(filters),
    queryFn: () => membershipPlansApi.findAll(filters),
  });
}

export function useMembershipPlan(id: string) {
  return useQuery({
    queryKey: membershipPlanKeys.detail(id),
    queryFn: () => membershipPlansApi.findById(id),
    enabled: !!id,
  });
}

export function useCreateMembershipPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof membershipPlansApi.create>[0]) => membershipPlansApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: membershipPlanKeys.lists() });
    },
  });
}

export function useUpdateMembershipPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof membershipPlansApi.update>[1] }) =>
      membershipPlansApi.update(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: membershipPlanKeys.lists() });
      queryClient.invalidateQueries({ queryKey: membershipPlanKeys.detail(variables.id) });
    },
  });
}

export function useDeleteMembershipPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => membershipPlansApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: membershipPlanKeys.lists() });
    },
  });
}
