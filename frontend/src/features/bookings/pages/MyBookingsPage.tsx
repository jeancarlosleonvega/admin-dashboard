import { useState } from 'react';
import { usePageHeader } from '@/hooks/usePageHeader';
import { BookOpen } from 'lucide-react';
import { useMyBookings, useCancelBooking } from '@/hooks/queries/useBookings';
import { useUploadTransferProof } from '@/hooks/queries/usePayments';
import { Spinner } from '@components/ui/Spinner';
import StatusBadge from '@components/shared/StatusBadge';
import toast from 'react-hot-toast';
import type { Booking } from '@/types/booking.types';
import { formatDate } from '@lib/formatDate';

type TabKey = 'upcoming' | 'past' | 'cancelled';

function BookingDetail({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const uploadProof = useUploadTransferProof();
  const cancelBooking = useCancelBooking();
  const [proofUrl, setProofUrl] = useState('');
  const [showProofForm, setShowProofForm] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const handleUpload = async () => {
    if (!booking.payment?.id || !proofUrl) return;
    try {
      await uploadProof.mutateAsync({ id: booking.payment.id, proofUrl });
      toast.success('Comprobante enviado correctamente');
      setShowProofForm(false);
    } catch {
      toast.error('Error al enviar comprobante');
    }
  };

  const handleCancel = async () => {
    try {
      await cancelBooking.mutateAsync(booking.id);
      toast.success('Reserva cancelada');
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message;
      toast.error(msg ?? 'Error al cancelar la reserva');
    }
  };

  const venue = booking.slot.venue;
  const sportName = (venue as any)?.sportType?.name;
  const canCancel = booking.status !== 'CANCELLED' && booking.status !== 'NO_SHOW';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-lg font-semibold">Detalle de reserva</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="space-y-3 text-sm">
          <div className="bg-gray-50 rounded-lg p-4 space-y-1.5">
            <p>
              <span className="font-medium text-gray-500">Espacio: </span>
              {sportName ? <><span className="font-semibold text-gray-700">{sportName}</span>: </> : null}
              {venue?.name}
            </p>
            <p><span className="font-medium text-gray-500">Fecha: </span>{formatDate(booking.slot.date)}</p>
            <p><span className="font-medium text-gray-500">Horario: </span>{booking.slot.startTime} – {booking.slot.endTime}</p>
            <p><span className="font-medium text-gray-500">Precio total: </span><strong>${parseFloat(booking.price.toString()).toLocaleString('es-AR')}</strong></p>
            {booking.isMemberPrice && <p className="text-blue-600 text-xs">Precio de socio</p>}
          </div>

          {booking.bookingServices.length > 0 && (
            <div>
              <p className="font-medium mb-1">Servicios adicionales:</p>
              <ul className="text-gray-600 space-y-1">
                {booking.bookingServices.map((bs) => (
                  <li key={bs.id} className="flex justify-between">
                    <span>{bs.service.name}</span>
                    <span>${parseFloat(bs.price.toString()).toLocaleString('es-AR')}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <StatusBadge status={booking.status} />
          </div>

          {booking.status === 'CONFIRMED' && booking.qrCode && (
            <div className="border-2 border-gray-300 rounded-lg p-6 text-center">
              <p className="text-xs text-gray-500 mb-2">Código QR</p>
              <p className="font-mono text-lg font-bold tracking-wider break-all">{booking.qrCode}</p>
              <p className="text-xs text-gray-400 mt-2">Mostrá este código al ingresar al club</p>
            </div>
          )}

          {booking.payment?.status === 'PENDING_PROOF' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm font-medium text-yellow-800 mb-2">Transferencia pendiente de comprobante</p>
              {!showProofForm ? (
                <button onClick={() => setShowProofForm(true)} className="text-sm text-blue-600 hover:underline">
                  Cargar comprobante de pago
                </button>
              ) : (
                <div className="space-y-2">
                  <input type="url" value={proofUrl} onChange={(e) => setProofUrl(e.target.value)} placeholder="URL del comprobante" className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm" />
                  <button onClick={handleUpload} disabled={!proofUrl || uploadProof.isPending} className="w-full py-1.5 bg-blue-600 text-white text-sm rounded disabled:opacity-50">
                    Enviar comprobante
                  </button>
                </div>
              )}
            </div>
          )}

          {booking.payment?.status === 'PENDING_CASH' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700">Pago pendiente en el club el día de la reserva.</p>
            </div>
          )}

          {booking.payment?.status === 'PENDING_VALIDATION' && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm text-purple-700">Tu comprobante está siendo revisado. Te confirmaremos tu reserva pronto.</p>
            </div>
          )}

          {canCancel && (
            <div className="pt-2 border-t border-gray-200">
              {!confirmCancel ? (
                <button
                  onClick={() => setConfirmCancel(true)}
                  className="w-full py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Cancelar reserva
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-gray-700 text-center">¿Confirmar cancelación?</p>
                  <div className="flex gap-2">
                    <button onClick={() => setConfirmCancel(false)} className="flex-1 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                      No
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={cancelBooking.isPending}
                      className="flex-1 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      {cancelBooking.isPending ? 'Cancelando...' : 'Sí, cancelar'}
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

export default function MyBookingsPage() {
  usePageHeader({ subtitle: 'Mis reservas' });

  const [activeTab, setActiveTab] = useState<TabKey>('upcoming');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const { data, isLoading } = useMyBookings({
    page: 1,
    limit: 50,
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const allBookings = data?.data ?? [];
  const bookings = allBookings.filter((b) => {
    const slotDate = new Date(b.slot.date);
    slotDate.setHours(0, 0, 0, 0);
    if (activeTab === 'upcoming') return b.status !== 'CANCELLED' && slotDate >= today;
    if (activeTab === 'past') return b.status !== 'CANCELLED' && slotDate < today;
    return b.status === 'CANCELLED';
  });

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'upcoming', label: 'Próximas' },
    { key: 'past', label: 'Pasadas' },
    { key: 'cancelled', label: 'Canceladas' },
  ];

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : bookings.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No hay reservas en esta categoría</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {bookings.map((booking) => {
              const venue = booking.slot.venue;
              const sportName = (venue as any)?.sportType?.name;
              return (
                <div
                  key={booking.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedBooking(booking)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <p className="font-medium text-gray-900">
                        {sportName ? <><span className="text-gray-700">{sportName}</span>: </> : null}
                        {venue?.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(booking.slot.date)} — {booking.slot.startTime} a {booking.slot.endTime}
                      </p>
                      <p className="text-sm text-gray-500">${parseFloat(booking.price.toString()).toLocaleString('es-AR')}</p>
                    </div>
                    <StatusBadge status={booking.status} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedBooking && (
        <BookingDetail booking={selectedBooking} onClose={() => setSelectedBooking(null)} />
      )}
    </div>
  );
}
