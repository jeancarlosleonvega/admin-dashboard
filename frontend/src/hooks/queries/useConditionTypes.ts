import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { conditionTypesApi } from '@api/conditionTypes.api';
import type { ConditionTypeFilters } from '@api/conditionTypes.api';

export const conditionTypeKeys = {
  all: ['condition-types'] as const,
  lists: () => [...conditionTypeKeys.all, 'list'] as const,
  list: (filters: ConditionTypeFilters) => [...conditionTypeKeys.lists(), filters] as const,
  details: () => [...conditionTypeKeys.all, 'detail'] as const,
  detail: (id: string) => [...conditionTypeKeys.details(), id] as const,
};

export function useConditionTypes(filters: ConditionTypeFilters = {}) {
  return useQuery({
    queryKey: conditionTypeKeys.list(filters),
    queryFn: () => conditionTypesApi.findAll(filters),
  });
}

export function useConditionType(id: string) {
  return useQuery({
    queryKey: conditionTypeKeys.detail(id),
    queryFn: () => conditionTypesApi.findById(id),
    enabled: !!id,
  });
}

export function useCreateConditionType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof conditionTypesApi.create>[0]) => conditionTypesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: conditionTypeKeys.lists() });
    },
  });
}

export function useUpdateConditionType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof conditionTypesApi.update>[1] }) =>
      conditionTypesApi.update(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: conditionTypeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: conditionTypeKeys.detail(variables.id) });
    },
  });
}

export function useDeleteConditionType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => conditionTypesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: conditionTypeKeys.lists() });
    },
  });
}
