import { z } from 'zod';

export const createMembershipPlanSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  price: z.number().min(0),
  monthlyReservationLimit: z.number().int().min(1).optional().nullable(),
  sportTypeId: z.string().uuid().optional().nullable(),
  active: z.boolean().default(true),
  baseBookingPrice: z.number().min(0).default(0),
  walletCreditEnabled: z.boolean().default(false),
  walletCreditAmount: z.number().min(0).optional().nullable(),
  walletPaymentEnabled: z.boolean().default(false),
});

export const updateMembershipPlanSchema = createMembershipPlanSchema.partial();

export const membershipPlanFiltersSchema = z.object({
  search: z.string().optional(),
  active: z.enum(['true', 'false']).optional(),
  sportTypeId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateMembershipPlanInput = z.infer<typeof createMembershipPlanSchema>;
export type UpdateMembershipPlanInput = z.infer<typeof updateMembershipPlanSchema>;
export type MembershipPlanFiltersInput = z.infer<typeof membershipPlanFiltersSchema>;
