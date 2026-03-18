import { z } from 'zod';

export const createSportTypeSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  active: z.boolean().default(true),
});

export const updateSportTypeSchema = createSportTypeSchema.partial();

export const sportTypeFiltersSchema = z.object({
  search: z.string().optional(),
  active: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateSportTypeInput = z.infer<typeof createSportTypeSchema>;
export type UpdateSportTypeInput = z.infer<typeof updateSportTypeSchema>;
export type SportTypeFiltersInput = z.infer<typeof sportTypeFiltersSchema>;
