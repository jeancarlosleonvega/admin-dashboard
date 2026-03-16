import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { suspensionsApi, type CreateSuspensionInput } from '@api/suspensions.api';

export const suspensionKeys = {
  all: ['suspensions'] as const,
  byUser: (userId: string) => [...suspensionKeys.all, userId] as const,
};

export function useUserSuspensions(userId: string) {
  return useQuery({
    queryKey: suspensionKeys.byUser(userId),
    queryFn: () => suspensionsApi.getSuspensions(userId),
    enabled: !!userId,
  });
}

export function useCreateSuspension() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSuspensionInput) => suspensionsApi.createSuspension(data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: suspensionKeys.byUser(vars.userId) });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useLiftSuspension(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => suspensionsApi.liftSuspension(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: suspensionKeys.byUser(userId) });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
