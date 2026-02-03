import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { permissionsApi } from '@api/roles.api';
import type { PermissionFilters, CreatePermissionInput, UpdatePermissionInput } from '@/types/role.types';

export const permissionKeys = {
  all: ['permissions'] as const,
  lists: () => [...permissionKeys.all, 'list'] as const,
  list: (filters: PermissionFilters) => [...permissionKeys.lists(), filters] as const,
  details: () => [...permissionKeys.all, 'detail'] as const,
  detail: (id: string) => [...permissionKeys.details(), id] as const,
  simple: () => [...permissionKeys.all, 'simple'] as const,
  resources: () => [...permissionKeys.all, 'resources'] as const,
};

export function usePermissions(filters: PermissionFilters = {}) {
  return useQuery({
    queryKey: permissionKeys.list(filters),
    queryFn: () => permissionsApi.getPermissions(filters),
  });
}

export function useAllPermissions() {
  return useQuery({
    queryKey: permissionKeys.simple(),
    queryFn: () => permissionsApi.getAllPermissions(),
    staleTime: 10 * 60 * 1000,
  });
}

export function usePermission(id: string) {
  return useQuery({
    queryKey: permissionKeys.detail(id),
    queryFn: () => permissionsApi.getPermission(id),
    enabled: !!id,
  });
}

export function usePermissionResources() {
  return useQuery({
    queryKey: permissionKeys.resources(),
    queryFn: () => permissionsApi.getResources(),
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreatePermission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePermissionInput) => permissionsApi.createPermission(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: permissionKeys.all });
    },
  });
}

export function useUpdatePermission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePermissionInput }) =>
      permissionsApi.updatePermission(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: permissionKeys.all });
    },
  });
}

export function useDeletePermission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => permissionsApi.deletePermission(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: permissionKeys.all });
    },
  });
}

export function useBulkDeletePermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => permissionsApi.bulkDeletePermissions(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: permissionKeys.all });
    },
  });
}
