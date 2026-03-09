import { z } from 'zod';

export const createBlockedPeriodSchema = z.object({
  sportTypeId: z.string().uuid().optional().nullable(),
  venueId: z.string().uuid().optional().nullable(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  reason: z.string().optional(),
  active: z.boolean().default(true),
});

export const updateBlockedPeriodSchema = createBlockedPeriodSchema.partial();

export const blockedPeriodFiltersSchema = z.object({
  sportTypeId: z.string().uuid().optional(),
  venueId: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateBlockedPeriodInput = z.infer<typeof createBlockedPeriodSchema>;
export type UpdateBlockedPeriodInput = z.infer<typeof updateBlockedPeriodSchema>;
export type BlockedPeriodFiltersInput = z.infer<typeof blockedPeriodFiltersSchema>;
