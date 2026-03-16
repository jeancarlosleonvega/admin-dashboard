import { useState } from 'react';
import { usePageHeader } from '@/hooks/usePageHeader';
import { BookOpen } from 'lucide-react';
import { useMyBookings } from '@/hooks/queries/useBookings';
import { Spinner } from '@components/ui/Spinner';
import StatusBadge from '@components/shared/StatusBadge';
import BookingDetailModal from '@components/shared/BookingDetailModal';
import type { Booking } from '@/types/booking.types';
import { formatDate } from '@lib/formatDate';

type TabKey = 'upcoming' | 'past' | 'cancelled';

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
        <BookingDetailModal booking={selectedBooking} onClose={() => setSelectedBooking(null)} />
      )}
    </div>
  );
}
