import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentsApi } from '@api/payments.api';

export const paymentKeys = {
  all: ['payments'] as const,
  pendingTransfers: () => [...paymentKeys.all, 'pending-transfers'] as const,
};

export function usePendingTransfers() {
  return useQuery({
    queryKey: paymentKeys.pendingTransfers(),
    queryFn: () => paymentsApi.getPendingTransfers(),
  });
}

export function useUploadTransferProof() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, proofUrl }: { id: string; proofUrl: string }) =>
      paymentsApi.uploadTransferProof(id, proofUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.all });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

export function useValidateTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { approved: boolean; reason?: string } }) =>
      paymentsApi.validateTransfer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.all });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}
