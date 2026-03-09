import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userMembershipsApi } from '@api/userMemberships.api';

export const userMembershipKeys = {
  all: ['user-memberships'] as const,
  lists: () => [...userMembershipKeys.all, 'list'] as const,
  list: (filters: any) => [...userMembershipKeys.lists(), filters] as const,
  my: () => [...userMembershipKeys.all, 'my'] as const,
  detail: (id: string) => [...userMembershipKeys.all, 'detail', id] as const,
};

export function useUserMemberships(filters?: { userId?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: userMembershipKeys.list(filters),
    queryFn: () => userMembershipsApi.getUserMemberships(filters),
  });
}

export function useMyMembership() {
  return useQuery({
    queryKey: userMembershipKeys.my(),
    queryFn: () => userMembershipsApi.getMyMembership(),
  });
}

export function useUserMembership(id: string) {
  return useQuery({
    queryKey: userMembershipKeys.detail(id),
    queryFn: () => userMembershipsApi.getUserMembership(id),
    enabled: !!id,
  });
}

export function useCreateUserMembership() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      userId: string;
      membershipPlanId: string;
      startDate: string;
      endDate?: string;
      notes?: string;
    }) => userMembershipsApi.createUserMembership(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userMembershipKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userMembershipKeys.my() });
    },
  });
}

export function useUpdateUserMembership() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { status?: string; endDate?: string | null; notes?: string } }) =>
      userMembershipsApi.updateUserMembership(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: userMembershipKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userMembershipKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: userMembershipKeys.my() });
    },
  });
}

export function useDeleteUserMembership() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => userMembershipsApi.deleteUserMembership(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userMembershipKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userMembershipKeys.my() });
    },
  });
}
