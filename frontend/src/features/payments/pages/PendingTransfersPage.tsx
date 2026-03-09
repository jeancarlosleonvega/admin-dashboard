import { useState } from 'react';
import { usePageHeader } from '@/hooks/usePageHeader';
import { DollarSign } from 'lucide-react';
import { usePendingTransfers, useValidateTransfer } from '@/hooks/queries/usePayments';
import { Spinner } from '@components/ui/Spinner';
import toast from 'react-hot-toast';

export default function PendingTransfersPage() {
  usePageHeader({ subtitle: 'Transferencias pendientes de validación' });

  const { data: payments, isLoading } = usePendingTransfers();
  const validateTransfer = useValidateTransfer();
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const handleApprove = async (id: string) => {
    try {
      await validateTransfer.mutateAsync({ id, data: { approved: true } });
      toast.success('Transferencia aprobada. Reserva confirmada.');
    } catch {
      toast.error('Error al aprobar transferencia');
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    try {
      await validateTransfer.mutateAsync({ id: rejectTarget, data: { approved: false, reason: rejectReason } });
      toast.success('Transferencia rechazada');
      setRejectTarget(null);
      setRejectReason('');
    } catch {
      toast.error('Error al rechazar transferencia');
    }
  };

  return (
    <div>
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : !payments || payments.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No hay transferencias pendientes</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {payments.map((payment) => (
              <div key={payment.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="font-medium text-gray-900">
                      {payment.booking.user.firstName} {payment.booking.user.lastName}
                      <span className="text-gray-500 text-sm ml-2">({payment.booking.user.email})</span>
                    </p>
                    <p className="text-sm text-gray-500">
                      {payment.booking.slot.venue.name} — {new Date(payment.booking.slot.date).toLocaleDateString()} {payment.booking.slot.startTime}–{payment.booking.slot.endTime}
                    </p>
                    <p className="text-sm font-semibold text-gray-900">Monto: ${parseFloat(payment.amount.toString()).toLocaleString()}</p>
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${payment.status === 'PENDING_PROOF' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
                      {payment.status === 'PENDING_PROOF' ? 'Esperando comprobante' : 'Pendiente de validación'}
                    </span>
                    {payment.transferProofUrl && (
                      <div className="mt-2">
                        <a href={payment.transferProofUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                          Ver comprobante
                        </a>
                      </div>
                    )}
                  </div>
                  {payment.status === 'PENDING_VALIDATION' && (
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleApprove(payment.id)}
                        disabled={validateTransfer.isPending}
                        className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        Aprobar
                      </button>
                      <button
                        onClick={() => setRejectTarget(payment.id)}
                        disabled={validateTransfer.isPending}
                        className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                      >
                        Rechazar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Rechazar transferencia</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Motivo del rechazo</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                rows={3}
                placeholder="Ingresa el motivo..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => { setRejectTarget(null); setRejectReason(''); }} className="btn-secondary">Cancelar</button>
              <button onClick={handleReject} disabled={validateTransfer.isPending} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2">
                {validateTransfer.isPending && <Spinner size="sm" />}
                Rechazar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
