import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { systemConfigApi } from '@api/systemConfig';

export const systemConfigKeys = {
  all: ['system-config'] as const,
  list: () => [...systemConfigKeys.all, 'list'] as const,
  detail: (key: string) => [...systemConfigKeys.all, 'detail', key] as const,
};

export function useSystemConfigs() {
  return useQuery({
    queryKey: systemConfigKeys.list(),
    queryFn: () => systemConfigApi.findAll(),
  });
}

export function useSystemConfig(key: string) {
  return useQuery({
    queryKey: systemConfigKeys.detail(key),
    queryFn: () => systemConfigApi.findByKey(key),
    enabled: !!key,
  });
}

export function useUpsertConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { key: string; value: string; label?: string; group?: string }) =>
      systemConfigApi.upsert(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemConfigKeys.list() });
    },
  });
}

export function useDeleteConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (key: string) => systemConfigApi.delete(key),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemConfigKeys.list() });
    },
  });
}
