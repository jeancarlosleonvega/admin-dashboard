import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsApi } from '@api/bookings.api';
import type { CreateBookingInput } from '@/types/booking.types';

type BookingFilters = { status?: string; page?: number; limit?: number; userId?: string; venueId?: string; date?: string };

export const bookingKeys = {
  all: ['bookings'] as const,
  my: (filters?: BookingFilters) => [...bookingKeys.all, 'my', filters] as const,
  lists: () => [...bookingKeys.all, 'list'] as const,
  list: (filters?: BookingFilters) => [...bookingKeys.lists(), filters] as const,
  detail: (id: string) => [...bookingKeys.all, 'detail', id] as const,
};

export function useMyBookings(filters?: { status?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: bookingKeys.my(filters),
    queryFn: () => bookingsApi.getMyBookings(filters),
  });
}

export function useBookings(filters?: {
  userId?: string;
  venueId?: string;
  status?: string;
  date?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: bookingKeys.list(filters),
    queryFn: () => bookingsApi.getBookings(filters),
  });
}

export function useBooking(id: string) {
  return useQuery({
    queryKey: bookingKeys.detail(id),
    queryFn: () => bookingsApi.getBooking(id),
    enabled: !!id,
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBookingInput) => bookingsApi.createBooking(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.all });
    },
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bookingsApi.cancelBooking(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.all });
    },
  });
}
