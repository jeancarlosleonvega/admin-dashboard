import { z } from 'zod';

export const factorRuleSchema = z.object({
  minValue: z.string().optional().nullable(),
  maxValue: z.string().optional().nullable(),
  enumValue: z.string().optional().nullable(),
  multiplier: z.number().positive(),
  label: z.string().optional().nullable(),
});

export const factorSchema = z.object({
  factorTypeId: z.string().uuid(),
  enabled: z.boolean(),
  rules: z.array(factorRuleSchema),
});

export const upsertRevenueConfigSchema = z.object({
  enabled: z.boolean(),
  minPrice: z.number().min(0),
  maxPrice: z.number().min(0),
  roundingStep: z.number().int().min(0),
  factors: z.array(factorSchema),
});

export const createFactorTypeSchema = z.object({
  name: z.string().min(1),
  key: z.string().min(1).regex(/^[a-zA-Z][a-zA-Z0-9_]*$/),
  valueType: z.enum(['NUMBER_RANGE', 'TIME_RANGE', 'ENUM']),
  enumValues: z.array(z.string()).optional().default([]),
  enumLabels: z.array(z.string()).optional().default([]),
  description: z.string().optional(),
});

export const updateFactorTypeSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  enumValues: z.array(z.string()).optional(),
  enumLabels: z.array(z.string()).optional(),
});

export type UpsertRevenueConfigInput = z.infer<typeof upsertRevenueConfigSchema>;
export type CreateFactorTypeInput = z.infer<typeof createFactorTypeSchema>;
export type UpdateFactorTypeInput = z.infer<typeof updateFactorTypeSchema>;
