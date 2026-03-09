import { z } from 'zod';

export const createVenueSchema = z.object({
  sportTypeId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  intervalMinutes: z.number().int().min(5).max(120).optional(),
  playersPerSlot: z.number().int().min(1).max(20).optional(),
  openTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  enabledDays: z.array(z.number().int().min(1).max(7)).optional(),
  active: z.boolean().default(true),
});

export const updateVenueSchema = createVenueSchema.partial();

export const venueFiltersSchema = z.object({
  search: z.string().optional(),
  sportTypeId: z.string().uuid().optional(),
  active: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateVenueInput = z.infer<typeof createVenueSchema>;
export type UpdateVenueInput = z.infer<typeof updateVenueSchema>;
export type VenueFiltersInput = z.infer<typeof venueFiltersSchema>;
