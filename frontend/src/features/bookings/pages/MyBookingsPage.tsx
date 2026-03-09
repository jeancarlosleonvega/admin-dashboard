import { useState } from 'react';
import { usePageHeader } from '@/hooks/usePageHeader';
import { BookOpen } from 'lucide-react';
import { useMyBookings } from '@/hooks/queries/useBookings';
import { useUploadTransferProof } from '@/hooks/queries/usePayments';
import { Spinner } from '@components/ui/Spinner';
import toast from 'react-hot-toast';
import type { Booking, BookingStatus } from '@/types/booking.types';

type TabKey = 'upcoming' | 'past' | 'cancelled';

const STATUS_BADGE: Record<BookingStatus, string> = {
  PENDING_PAYMENT: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  NO_SHOW: 'bg-gray-100 text-gray-700',
};

const STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING_PAYMENT: 'Pago pendiente',
  CONFIRMED: 'Confirmada',
  CANCELLED: 'Cancelada',
  NO_SHOW: 'No se presentó',
};

function BookingDetail({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const uploadProof = useUploadTransferProof();
  const [proofUrl, setProofUrl] = useState('');
  const [showProofForm, setShowProofForm] = useState(false);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-lg font-semibold">Detalle de reserva</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="space-y-3 text-sm">
          <div className="bg-gray-50 rounded-lg p-4 space-y-1">
            <p><span className="font-medium">Venue:</span> {booking.slot.venue?.name}</p>
            <p><span className="font-medium">Fecha:</span> {new Date(booking.slot.date).toLocaleDateString()}</p>
            <p><span className="font-medium">Horario:</span> {booking.slot.startTime} - {booking.slot.endTime}</p>
            <p><span className="font-medium">Precio total:</span> ${parseFloat(booking.price.toString()).toLocaleString()}</p>
            {booking.isMemberPrice && <p className="text-blue-600 text-xs">Precio de socio</p>}
          </div>

          {booking.bookingServices.length > 0 && (
            <div>
              <p className="font-medium mb-1">Servicios adicionales:</p>
              <ul className="text-gray-600 space-y-1">
                {booking.bookingServices.map((bs) => (
                  <li key={bs.id} className="flex justify-between">
                    <span>{bs.service.name}</span>
                    <span>${parseFloat(bs.price.toString()).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${STATUS_BADGE[booking.status]}`}>
              {STATUS_LABEL[booking.status]}
            </span>
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
        </div>
      </div>
    </div>
  );
}

export default function MyBookingsPage() {
  usePageHeader({ subtitle: 'Mis reservas' });

  const [activeTab, setActiveTab] = useState<TabKey>('upcoming');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const statusByTab: Partial<Record<TabKey, BookingStatus>> = {
    cancelled: 'CANCELLED',
  };

  const { data, isLoading } = useMyBookings({
    status: statusByTab[activeTab],
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
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedBooking(booking)}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <p className="font-medium text-gray-900">{booking.slot.venue?.name}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(booking.slot.date).toLocaleDateString()} — {booking.slot.startTime} a {booking.slot.endTime}
                    </p>
                    <p className="text-sm text-gray-500">${parseFloat(booking.price.toString()).toLocaleString()}</p>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${STATUS_BADGE[booking.status]}`}>
                    {STATUS_LABEL[booking.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedBooking && (
        <BookingDetail booking={selectedBooking} onClose={() => setSelectedBooking(null)} />
      )}
    </div>
  );
}
