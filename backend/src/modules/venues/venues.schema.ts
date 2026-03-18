import { z } from 'zod';

const operatingHoursSchema = z.object({
  daysOfWeek: z.array(z.number().int().min(1).max(7)).min(1),
  openTime: z.string().regex(/^\d{2}:\d{2}$/),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/),
});

export const createVenueSchema = z.object({
  sportTypeId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  active: z.boolean().default(true),
  operatingHours: z.array(operatingHoursSchema).optional(),
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
