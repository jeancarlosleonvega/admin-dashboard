import { useState } from 'react';
import { useCancelBooking } from '@/hooks/queries/useBookings';
import { useUploadTransferProof } from '@/hooks/queries/usePayments';
import StatusBadge from '@components/shared/StatusBadge';
import { formatDate } from '@lib/formatDate';
import toast from 'react-hot-toast';
import type { Booking } from '@/types/booking.types';

const METHOD_LABEL: Record<string, string> = {
  MERCADOPAGO: 'MercadoPago',
  TRANSFER: 'Transferencia',
  CASH: 'Efectivo',
  WALLET: 'Wallet',
};

function cancelMessage(booking: Booking): string {
  if (booking.status !== 'CONFIRMED') {
    return 'El turno quedará disponible nuevamente. No se realizó ningún cobro.';
  }
  const method = booking.payment?.method;
  if (method === 'WALLET') return `Se reintegrará $${parseFloat(booking.price.toString()).toLocaleString('es-AR')} a tu wallet automáticamente.`;
  if (method === 'MERCADOPAGO') return 'El reembolso se procesará en MercadoPago (puede demorar 48-72hs).';
  if (method === 'TRANSFER') return 'El reembolso debe coordinarse con administración.';
  return 'El turno quedará disponible.';
}

interface Props {
  booking: Booking;
  onClose: () => void;
  isAdmin?: boolean;
}

export default function BookingDetailModal({ booking, onClose, isAdmin = false }: Props) {
  const cancelBooking = useCancelBooking();
  const uploadProof = useUploadTransferProof();

  const [confirmCancel, setConfirmCancel] = useState(false);
  const [proofUrl, setProofUrl] = useState('');
  const [showProofForm, setShowProofForm] = useState(false);

  const venue = booking.slot.venue;
  const sportName = (venue as any)?.sportType?.name;

  const canCancel = booking.status !== 'CANCELLED' && booking.status !== 'NO_SHOW';

  const handleCancel = async () => {
    try {
      await cancelBooking.mutateAsync(booking.id);
      toast.success('Reserva cancelada');
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message ?? 'Error al cancelar la reserva';
      toast.error(msg);
    }
  };

  const handleUploadProof = async () => {
    if (!booking.payment?.id || !proofUrl) return;
    try {
      await uploadProof.mutateAsync({ id: booking.payment.id, proofUrl });
      toast.success('Comprobante enviado correctamente');
      setShowProofForm(false);
    } catch {
      toast.error('Error al enviar comprobante');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center px-6 pt-5 pb-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Detalle de reserva</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Admin: datos del socio */}
          {isAdmin && booking.user && (
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <p className="font-medium text-gray-700">
                {booking.user.firstName} {booking.user.lastName}
              </p>
              <p className="text-gray-500">{booking.user.email}</p>
            </div>
          )}

          {/* Datos del turno */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Espacio</span>
              <span className="font-medium text-gray-900">
                {sportName ? <><span className="text-gray-600">{sportName}:</span> </> : null}
                {venue?.name ?? '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Fecha</span>
              <span className="font-medium text-gray-900">{formatDate(booking.slot.date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Horario</span>
              <span className="font-medium text-gray-900">{booking.slot.startTime} – {booking.slot.endTime}</span>
            </div>
            {booking.numPlayers && (
              <div className="flex justify-between">
                <span className="text-gray-500">Jugadores</span>
                <span className="font-medium text-gray-900">{booking.numPlayers}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Monto</span>
              <span className="font-semibold text-gray-900">
                ${parseFloat(booking.price.toString()).toLocaleString('es-AR')}
                {booking.isMemberPrice && <span className="ml-1 text-xs text-blue-600">(precio socio)</span>}
              </span>
            </div>
            {booking.payment && (
              <div className="flex justify-between">
                <span className="text-gray-500">Método de pago</span>
                <span className="font-medium text-gray-900">{METHOD_LABEL[booking.payment.method] ?? booking.payment.method}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Estado</span>
              <StatusBadge status={booking.status} />
            </div>
            {booking.payment && booking.status === 'PENDING_PAYMENT' && (
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Estado de pago</span>
                <StatusBadge status={booking.payment.status} />
              </div>
            )}
          </div>

          {/* Servicios adicionales */}
          {booking.bookingServices.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Servicios adicionales</p>
              <ul className="space-y-1 text-sm">
                {booking.bookingServices.map((bs) => (
                  <li key={bs.id} className="flex justify-between text-gray-700">
                    <span>{bs.service.name}</span>
                    <span>${parseFloat(bs.price.toString()).toLocaleString('es-AR')}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* QR */}
          {booking.status === 'CONFIRMED' && booking.qrCode && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <p className="text-xs text-gray-400 mb-1">Código de acceso</p>
              <p className="font-mono text-base font-bold tracking-widest break-all text-gray-900">{booking.qrCode}</p>
              <p className="text-xs text-gray-400 mt-1">Presentá este código al ingresar</p>
            </div>
          )}

          {/* Cargar comprobante */}
          {booking.payment?.status === 'PENDING_PROOF' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm font-medium text-yellow-800 mb-2">Pendiente de comprobante de transferencia</p>
              {!showProofForm ? (
                <button onClick={() => setShowProofForm(true)} className="text-sm text-blue-600 hover:underline">
                  Cargar comprobante
                </button>
              ) : (
                <div className="space-y-2">
                  <input
                    type="url"
                    value={proofUrl}
                    onChange={(e) => setProofUrl(e.target.value)}
                    placeholder="URL del comprobante"
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                  />
                  <button
                    onClick={handleUploadProof}
                    disabled={!proofUrl || uploadProof.isPending}
                    className="w-full py-1.5 bg-blue-600 text-white text-sm rounded disabled:opacity-50"
                  >
                    Enviar
                  </button>
                </div>
              )}
            </div>
          )}

          {booking.payment?.status === 'PENDING_VALIDATION' && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm text-purple-700">
              Comprobante enviado — pendiente de validación por administración.
            </div>
          )}

          {/* Cancelar */}
          {canCancel && (
            <div className="pt-2 border-t border-gray-200">
              {!confirmCancel ? (
                <button
                  onClick={() => setConfirmCancel(true)}
                  className="w-full py-2.5 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Cancelar reserva
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                    <p className="font-medium mb-1">¿Confirmar cancelación?</p>
                    <p>{cancelMessage(booking)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmCancel(false)}
                      className="flex-1 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      No, volver
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={cancelBooking.isPending}
                      className="flex-1 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      {cancelBooking.isPending ? 'Cancelando…' : 'Sí, cancelar'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
