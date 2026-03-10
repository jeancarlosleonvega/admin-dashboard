import { z } from 'zod';

export const createConditionTypeSchema = z.object({
  name: z.string().min(1).max(100),
  key: z.string().min(1).max(100).regex(/^[a-z_]+$/, 'Solo minúsculas y guiones bajos'),
  dataType: z.enum(['NUMBER', 'STRING', 'UUID', 'ENUM']),
  allowedOperators: z.array(z.enum(['EQ', 'NEQ', 'GT', 'GTE', 'LT', 'LTE'])).min(1),
  description: z.string().max(500).optional().nullable(),
  active: z.boolean().default(true),
});

export const updateConditionTypeSchema = createConditionTypeSchema.omit({ key: true }).partial();

export const conditionTypeFiltersSchema = z.object({
  search: z.string().optional(),
  active: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateConditionTypeInput = z.infer<typeof createConditionTypeSchema>;
export type UpdateConditionTypeInput = z.infer<typeof updateConditionTypeSchema>;
export type ConditionTypeFiltersInput = z.infer<typeof conditionTypeFiltersSchema>;
