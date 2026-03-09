import { z } from 'zod';

export const slotsQuerySchema = z.object({
  venueId: z.string().uuid(),
  date: z.string(),
});

export const slotsAvailabilityQuerySchema = z.object({
  venueId: z.string().uuid(),
  startDate: z.string(),
  endDate: z.string(),
});

export type SlotsQueryInput = z.infer<typeof slotsQuerySchema>;
export type SlotsAvailabilityQueryInput = z.infer<typeof slotsAvailabilityQuerySchema>;
