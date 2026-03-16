import { useState } from 'react';
import { usePageHeader } from '@/hooks/usePageHeader';
import { Calendar, Eye, UserX } from 'lucide-react';
import { useBookings, useMarkNoShow } from '@/hooks/queries/useBookings';
import { Spinner } from '@components/ui/Spinner';
import StatusBadge from '@components/shared/StatusBadge';
import BookingDetailModal from '@components/shared/BookingDetailModal';
import type { Booking, BookingStatus } from '@/types/booking.types';
import { formatDate } from '@lib/formatDate';
import toast from 'react-hot-toast';

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  MERCADOPAGO: 'MercadoPago',
  TRANSFER: 'Transferencia',
  CASH: 'Efectivo',
  WALLET: 'Wallet',
};

export default function AdminBookingsPage() {
  usePageHeader({ subtitle: 'Listado de todas las reservas' });

  const [filters, setFilters] = useState<{
    status?: BookingStatus;
    venueId?: string;
    date?: string;
    page: number;
    limit: number;
  }>({ page: 1, limit: 20 });

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [confirmNoShow, setConfirmNoShow] = useState<Booking | null>(null);

  const { data, isLoading, isError } = useBookings(filters);
  const markNoShow = useMarkNoShow();

  const handleNoShow = async (booking: Booking) => {
    try {
      await markNoShow.mutateAsync(booking.id);
      toast.success('Reserva marcada como ausencia');
      setConfirmNoShow(null);
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message ?? 'Error al marcar ausencia';
      toast.error(msg);
    }
  };

  const isSlotPast = (booking: Booking) => {
    const slotDate = new Date(booking.slot.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return slotDate < today;
  };
  const bookings = data?.data ?? [];
  const meta = data?.meta ?? { page: 1, limit: 20, total: 0, totalPages: 0 };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="card p-4 flex gap-4 flex-wrap">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Estado</label>
          <select
            value={filters.status ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, status: (e.target.value as BookingStatus) || undefined, page: 1 }))}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
          >
            <option value="">Todos</option>
            <option value="PENDING_PAYMENT">Pago pendiente</option>
            <option value="CONFIRMED">Confirmadas</option>
            <option value="CANCELLED">Canceladas</option>
            <option value="NO_SHOW">No se presentó</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Fecha</label>
          <input
            type="date"
            value={filters.date ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, date: e.target.value || undefined, page: 1 }))}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : isError ? (
          <div className="px-6 py-12 text-center text-red-500"><p>Error al cargar reservas</p></div>
        ) : bookings.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No se encontraron reservas</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Socio</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Espacio</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hora</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Método</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {booking.user ? `${booking.user.firstName} ${booking.user.lastName}` : booking.userId}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {booking.slot.venue
                          ? <><span className="font-medium text-gray-700">{booking.slot.venue.sportType.name}</span>: {booking.slot.venue.name}</>
                          : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatDate(booking.slot.date)}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{booking.slot.startTime} - {booking.slot.endTime}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={booking.status} />
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">${parseFloat(booking.price.toString()).toLocaleString('es-AR')}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{booking.payment ? PAYMENT_METHOD_LABEL[booking.payment.method] ?? booking.payment.method : '-'}</td>
                      <td className="px-6 py-4 text-right flex items-center justify-end gap-1">
                        {booking.status === 'CONFIRMED' && isSlotPast(booking) && (
                          <button
                            onClick={() => setConfirmNoShow(booking)}
                            className="p-1.5 text-gray-400 hover:text-orange-600 rounded hover:bg-orange-50"
                            title="Marcar ausencia"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedBooking(booking)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50"
                          title="Ver detalle"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {meta.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Mostrando {(meta.page - 1) * meta.limit + 1} a {Math.min(meta.page * meta.limit, meta.total)} de {meta.total}
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))} disabled={meta.page <= 1} className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50">Anterior</button>
                  <button onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))} disabled={meta.page >= meta.totalPages} className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50">Siguiente</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          isAdmin
        />
      )}

      {confirmNoShow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-base font-semibold text-gray-900">¿Marcar como ausente?</h3>
            <p className="text-sm text-gray-600">
              Se registrará que <strong>{confirmNoShow.user?.firstName} {confirmNoShow.user?.lastName}</strong> no se presentó.
              Si supera el umbral de ausencias, se suspenderá automáticamente.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmNoShow(null)}
                className="flex-1 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleNoShow(confirmNoShow)}
                disabled={markNoShow.isPending}
                className="flex-1 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                {markNoShow.isPending ? 'Marcando…' : 'Marcar ausencia'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
