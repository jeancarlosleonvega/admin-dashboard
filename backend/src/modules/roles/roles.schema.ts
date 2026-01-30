import { z } from 'zod';

export const createRoleSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  description: z.string().max(200).optional(),
  permissionIds: z.array(z.string().uuid()).optional(),
});

export const updateRoleSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  description: z.string().max(200).nullable().optional(),
  permissionIds: z.array(z.string().uuid()).optional(),
});

export const roleFiltersSchema = z.object({
  search: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  isSystem: z.enum(['true', 'false']).optional(),
  sortBy: z.enum(['name', 'isSystem', 'createdAt']).optional(),
  sortDirection: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type RoleFiltersInput = z.infer<typeof roleFiltersSchema>;
