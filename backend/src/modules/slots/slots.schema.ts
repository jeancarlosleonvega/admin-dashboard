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

export const slotsSearchSchema = z.object({
  startDate: z.string(),
  endDate: z.string().optional(),
  venueId: z.string().uuid().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  numPlayers: z.coerce.number().int().min(1).optional(),
});

export type SlotsQueryInput = z.infer<typeof slotsQuerySchema>;
export type SlotsAvailabilityQueryInput = z.infer<typeof slotsAvailabilityQuerySchema>;
export type SlotsSearchInput = z.infer<typeof slotsSearchSchema>;
