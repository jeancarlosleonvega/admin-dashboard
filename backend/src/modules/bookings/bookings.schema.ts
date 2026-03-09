import { z } from 'zod';

export const createBookingSchema = z.object({
  slotId: z.string().uuid(),
  serviceIds: z.array(z.string().uuid()).optional(),
  paymentMethod: z.enum(['MERCADOPAGO', 'TRANSFER', 'CASH']),
  notes: z.string().optional(),
});

export const bookingFiltersSchema = z.object({
  userId: z.string().uuid().optional(),
  venueId: z.string().uuid().optional(),
  status: z.enum(['PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'NO_SHOW']).optional(),
  date: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const myBookingFiltersSchema = z.object({
  status: z.enum(['PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'NO_SHOW']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type BookingFiltersInput = z.infer<typeof bookingFiltersSchema>;
export type MyBookingFiltersInput = z.infer<typeof myBookingFiltersSchema>;
