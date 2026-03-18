import { z } from 'zod';

export const upsertConfigSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.string().min(1),
  label: z.string().max(200).optional(),
  group: z.string().max(100).optional(),
});

export const upsertManyConfigSchema = z.object({
  items: z.array(upsertConfigSchema).min(1),
});

export type UpsertConfigInput = z.infer<typeof upsertConfigSchema>;
export type UpsertManyConfigInput = z.infer<typeof upsertManyConfigSchema>;
