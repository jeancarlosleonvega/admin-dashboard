import { z } from 'zod';

export const timeRuleSchema = z.object({
  label: z.string().optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  multiplier: z.number().positive(),
});

export const dayRuleSchema = z.object({
  dayType: z.enum(['WEEKDAY', 'FRIDAY', 'WEEKEND', 'HOLIDAY']),
  multiplier: z.number().positive(),
  label: z.string().optional(),
});

export const occupancyRuleSchema = z.object({
  minOccupancy: z.number().int().min(0).max(100),
  maxOccupancy: z.number().int().min(0).max(100),
  multiplier: z.number().positive(),
});

export const upsertRevenueConfigSchema = z.object({
  enabled: z.boolean(),
  minPrice: z.number().min(0),
  maxPrice: z.number().min(0),
  roundingStep: z.number().int().min(0),
  timeRules: z.array(timeRuleSchema),
  dayRules: z.array(dayRuleSchema),
  occupancyRules: z.array(occupancyRuleSchema),
});

export type UpsertRevenueConfigInput = z.infer<typeof upsertRevenueConfigSchema>;
