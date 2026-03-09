import { z } from 'zod';

export const createUserMembershipSchema = z.object({
  userId: z.string().uuid(),
  membershipPlanId: z.string().uuid(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export const updateUserMembershipSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'CANCELLED', 'EXPIRED']).optional(),
  endDate: z.string().datetime().optional().nullable(),
  notes: z.string().optional(),
});

export const userMembershipFiltersSchema = z.object({
  userId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateUserMembershipInput = z.infer<typeof createUserMembershipSchema>;
export type UpdateUserMembershipInput = z.infer<typeof updateUserMembershipSchema>;
export type UserMembershipFiltersInput = z.infer<typeof userMembershipFiltersSchema>;
