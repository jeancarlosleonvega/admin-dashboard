import { useState } from 'react';
import { usePageHeader } from '@/hooks/usePageHeader';
import { Calendar } from 'lucide-react';
import { useBookings } from '@/hooks/queries/useBookings';
import { Spinner } from '@components/ui/Spinner';
import type { BookingStatus } from '@/types/booking.types';
import { formatDate } from '@lib/formatDate';

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

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  MERCADOPAGO: 'MercadoPago',
  TRANSFER: 'Transferencia',
  CASH: 'Efectivo',
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

  const { data, isLoading, isError } = useBookings(filters);
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
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${STATUS_BADGE[booking.status]}`}>
                          {STATUS_LABEL[booking.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">${parseFloat(booking.price.toString()).toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{booking.payment ? PAYMENT_METHOD_LABEL[booking.payment.method] : '-'}</td>
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
    </div>
  );
}
