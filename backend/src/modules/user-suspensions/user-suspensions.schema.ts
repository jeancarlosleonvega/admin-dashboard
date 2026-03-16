import { z } from 'zod';

export const createSuspensionSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().min(1, 'El motivo es obligatorio').max(500),
  startDate: z.string().refine((v) => !isNaN(Date.parse(v)), 'Fecha inválida'),
  endDate: z.string().refine((v) => !isNaN(Date.parse(v)), 'Fecha inválida').optional(),
});

export const suspensionFiltersSchema = z.object({
  userId: z.string().uuid().optional(),
});

export type CreateSuspensionInput = z.infer<typeof createSuspensionSchema>;
export type SuspensionFiltersInput = z.infer<typeof suspensionFiltersSchema>;
