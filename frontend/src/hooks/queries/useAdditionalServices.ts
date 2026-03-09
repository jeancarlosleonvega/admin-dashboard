import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { additionalServicesApi } from '@api/additionalServices.api';

export const additionalServiceKeys = {
  all: ['additional-services'] as const,
  lists: () => [...additionalServiceKeys.all, 'list'] as const,
  list: (filters: any) => [...additionalServiceKeys.lists(), filters] as const,
  detail: (id: string) => [...additionalServiceKeys.all, 'detail', id] as const,
};

export function useAdditionalServices(filters?: {
  sportTypeId?: string;
  active?: boolean;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: additionalServiceKeys.list(filters),
    queryFn: () => additionalServicesApi.getAdditionalServices(filters),
  });
}

export function useAdditionalService(id: string) {
  return useQuery({
    queryKey: additionalServiceKeys.detail(id),
    queryFn: () => additionalServicesApi.getAdditionalService(id),
    enabled: !!id,
  });
}

export function useCreateAdditionalService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof additionalServicesApi.createAdditionalService>[0]) =>
      additionalServicesApi.createAdditionalService(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: additionalServiceKeys.lists() });
    },
  });
}

export function useUpdateAdditionalService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof additionalServicesApi.updateAdditionalService>[1];
    }) => additionalServicesApi.updateAdditionalService(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: additionalServiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: additionalServiceKeys.detail(variables.id) });
    },
  });
}

export function useDeleteAdditionalService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => additionalServicesApi.deleteAdditionalService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: additionalServiceKeys.lists() });
    },
  });
}
