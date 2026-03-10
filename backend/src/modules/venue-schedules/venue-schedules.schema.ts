import { z } from 'zod';

export const createVenueScheduleSchema = z.object({
  venueId: z.string().uuid(),
  name: z.string().min(1).max(100),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional().nullable(),
  daysOfWeek: z.array(z.number().int().min(1).max(7)).min(1),
  openTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  intervalMinutes: z.number().int().min(5).max(240).optional().nullable(),
  playersPerSlot: z.number().int().min(1).max(100).optional().nullable(),
  active: z.boolean().default(true),
});

export const updateVenueScheduleSchema = createVenueScheduleSchema.partial();

export const venueScheduleFiltersSchema = z.object({
  venueId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const generateSlotsSchema = z.object({
  until: z.string(),
});

export type CreateVenueScheduleInput = z.infer<typeof createVenueScheduleSchema>;
export type UpdateVenueScheduleInput = z.infer<typeof updateVenueScheduleSchema>;
export type VenueScheduleFiltersInput = z.infer<typeof venueScheduleFiltersSchema>;
export type GenerateSlotsInput = z.infer<typeof generateSlotsSchema>;
