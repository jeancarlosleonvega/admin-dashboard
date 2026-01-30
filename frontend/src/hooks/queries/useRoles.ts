import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rolesApi } from '@api/roles.api';
import type { RoleFilters, CreateRoleInput, UpdateRoleInput } from '@/types/role.types';

export const roleKeys = {
  all: ['roles'] as const,
  lists: () => [...roleKeys.all, 'list'] as const,
  list: (filters: RoleFilters) => [...roleKeys.lists(), filters] as const,
  details: () => [...roleKeys.all, 'detail'] as const,
  detail: (id: string) => [...roleKeys.details(), id] as const,
  simple: () => [...roleKeys.all, 'simple'] as const,
};

export function useRoles(filters: RoleFilters = {}) {
  return useQuery({
    queryKey: roleKeys.list(filters),
    queryFn: () => rolesApi.getRoles(filters),
  });
}

export function useRolesList() {
  return useQuery({
    queryKey: roleKeys.simple(),
    queryFn: () => rolesApi.getRolesList(),
    staleTime: 10 * 60 * 1000,
  });
}

export function useRole(id: string) {
  return useQuery({
    queryKey: roleKeys.detail(id),
    queryFn: () => rolesApi.getRole(id),
    enabled: !!id,
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRoleInput) => rolesApi.createRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.all });
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRoleInput }) =>
      rolesApi.updateRole(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.all });
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => rolesApi.deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.all });
    },
  });
}
