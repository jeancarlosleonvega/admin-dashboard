import { z } from 'zod';

export const transferProofSchema = z.object({
  proofUrl: z.string().url(),
});

export const validateTransferSchema = z.object({
  approved: z.boolean(),
  reason: z.string().optional(),
});

export type TransferProofInput = z.infer<typeof transferProofSchema>;
export type ValidateTransferInput = z.infer<typeof validateTransferSchema>;
