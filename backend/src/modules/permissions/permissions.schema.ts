import { z } from 'zod';

export const createPermissionSchema = z.object({
  resource: z.string().min(1, 'Resource is required').max(50),
  action: z.string().min(1, 'Action is required').max(50),
  description: z.string().max(200).optional(),
});

export const updatePermissionSchema = z.object({
  resource: z.string().min(1).max(50).optional(),
  action: z.string().min(1).max(50).optional(),
  description: z.string().max(200).nullable().optional(),
});

export const permissionFiltersSchema = z.object({
  search: z.string().optional(),
  resource: z.string().optional(),
  action: z.string().optional(),
  description: z.string().optional(),
  sortBy: z.enum(['resource', 'action', 'createdAt']).optional(),
  sortDirection: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

export const bulkDeletePermissionsSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'At least one ID is required'),
});

export type CreatePermissionInput = z.infer<typeof createPermissionSchema>;
export type UpdatePermissionInput = z.infer<typeof updatePermissionSchema>;
export type PermissionFiltersInput = z.infer<typeof permissionFiltersSchema>;
