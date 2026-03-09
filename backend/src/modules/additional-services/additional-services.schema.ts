import { z } from 'zod';

export const createAdditionalServiceSchema = z.object({
  sportTypeId: z.string().uuid().optional().nullable(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  price: z.number().min(0),
  active: z.boolean().default(true),
});

export const updateAdditionalServiceSchema = createAdditionalServiceSchema.partial();

export const additionalServiceFiltersSchema = z.object({
  sportTypeId: z.string().uuid().optional(),
  active: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateAdditionalServiceInput = z.infer<typeof createAdditionalServiceSchema>;
export type UpdateAdditionalServiceInput = z.infer<typeof updateAdditionalServiceSchema>;
export type AdditionalServiceFiltersInput = z.infer<typeof additionalServiceFiltersSchema>;
