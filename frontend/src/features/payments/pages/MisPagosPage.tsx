import { useState } from 'react';
import { usePageHeader } from '@/hooks/usePageHeader';
import { CreditCard } from 'lucide-react';
import { useMyPayments, useUploadTransferProof } from '@/hooks/queries/usePayments';
import { Spinner } from '@components/ui/Spinner';
import StatusBadge from '@components/shared/StatusBadge';
import { formatDate } from '@lib/formatDate';
import toast from 'react-hot-toast';
import type { PaymentWithBooking } from '@api/payments.api';

const METHOD_LABEL: Record<string, string> = {
  TRANSFER: 'Transferencia',
  MERCADOPAGO: 'MercadoPago',
  CASH: 'Efectivo',
  WALLET: 'Wallet',
};

function PaymentDetail({ payment, onClose }: { payment: PaymentWithBooking; onClose: () => void }) {
  const uploadProof = useUploadTransferProof();
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [showProofForm, setShowProofForm] = useState(false);

  const handleUpload = async () => {
    if (!proofFile) return;
    try {
      await uploadProof.mutateAsync({ id: payment.id, file: proofFile });
      toast.success('Comprobante enviado');
      setShowProofForm(false);
      setProofFile(null);
    } catch {
      toast.error('Error al enviar comprobante');
    }
  };

  const { slot } = payment.booking;
  const venue = slot.venue;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-lg font-semibold">Detalle del pago</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="space-y-3 text-sm">
          <div className="bg-gray-50 rounded-lg p-4 space-y-1.5">
            <p>
              <span className="font-medium text-gray-500">Espacio: </span>
              <span className="font-semibold text-gray-700">{venue.sportType.name}</span>: {venue.name}
            </p>
            <p><span className="font-medium text-gray-500">Fecha: </span>{formatDate(slot.date)}</p>
            <p><span className="font-medium text-gray-500">Horario: </span>{slot.startTime} – {slot.endTime}</p>
            <p><span className="font-medium text-gray-500">Monto: </span><strong>${Number(payment.amount).toLocaleString('es-AR')}</strong></p>
            <p><span className="font-medium text-gray-500">Método: </span>{METHOD_LABEL[payment.method] ?? payment.method}</p>
            {payment.createdAt && (
              <p><span className="font-medium text-gray-500">Fecha de pago: </span>{new Date(payment.createdAt).toLocaleDateString('es-AR')}</p>
            )}
          </div>

          <div>
            <StatusBadge status={payment.status} />
          </div>

          {payment.status === 'PENDING_PROOF' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm font-medium text-yellow-800 mb-2">Transferencia pendiente de comprobante</p>
              {!showProofForm ? (
                <button onClick={() => setShowProofForm(true)} className="text-sm text-blue-600 hover:underline">
                  Cargar comprobante de pago
                </button>
              ) : (
                <div className="space-y-2">
                  <label className="block">
                    <span className="text-xs text-yellow-700 mb-1 block">JPG, PNG, WEBP o PDF · máx. 10 MB</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                      className="block w-full text-sm text-gray-700 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-yellow-100 file:text-yellow-800 hover:file:bg-yellow-200 cursor-pointer"
                    />
                  </label>
                  {proofFile && (
                    <p className="text-xs text-gray-500 truncate">Seleccionado: {proofFile.name}</p>
                  )}
                  <button
                    onClick={handleUpload}
                    disabled={!proofFile || uploadProof.isPending}
                    className="w-full py-1.5 bg-blue-600 text-white text-sm rounded disabled:opacity-50"
                  >
                    {uploadProof.isPending ? 'Enviando...' : 'Enviar comprobante'}
                  </button>
                </div>
              )}
            </div>
          )}

          {payment.status === 'PENDING_VALIDATION' && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm text-purple-700">Tu comprobante está siendo revisado. Te confirmaremos pronto.</p>
            </div>
          )}

          {payment.status === 'REJECTED' && payment.rejectionReason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm font-medium text-red-700 mb-1">Motivo del rechazo:</p>
              <p className="text-sm text-red-600">{payment.rejectionReason}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MisPagosPage() {
  usePageHeader({ subtitle: 'Mis pagos' });

  const { data: payments, isLoading } = useMyPayments();
  const [selected, setSelected] = useState<PaymentWithBooking | null>(null);

  return (
    <div>
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : !payments || payments.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No tenés pagos registrados</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {payments.map((payment) => {
              const { slot } = payment.booking;
              const venue = slot.venue;
              return (
                <div
                  key={payment.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelected(payment)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <p className="font-medium text-gray-900">
                        <span className="text-gray-700">{venue.sportType.name}</span>: {venue.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(slot.date)} — {slot.startTime} a {slot.endTime}
                      </p>
                      <p className="text-sm text-gray-500">
                        {METHOD_LABEL[payment.method] ?? payment.method} · ${Number(payment.amount).toLocaleString('es-AR')}
                      </p>
                    </div>
                    <StatusBadge status={payment.status} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selected && <PaymentDetail payment={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
