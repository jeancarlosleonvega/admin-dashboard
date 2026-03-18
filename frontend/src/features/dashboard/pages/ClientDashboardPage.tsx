import { useNavigate } from 'react-router-dom';
import { PlusCircle, BookOpen, Receipt, Calendar, CreditCard, ChevronRight, Clock } from 'lucide-react';
import { useAuthStore } from '@stores/authStore';
import { useMyBookings } from '@/hooks/queries/useBookings';
import { useMyMembership } from '@/hooks/queries/useUserMemberships';
import { Spinner } from '@components/ui/Spinner';
import StatusBadge from '@components/shared/StatusBadge';
import { formatDate } from '@lib/formatDate';

const MEMBERSHIP_STATUS_LABEL: Record<string, { label: string; color: string }> = {
  ACTIVE:    { label: 'Activa',    color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  PENDING:   { label: 'Pendiente', color: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
  INACTIVE:  { label: 'Inactiva',  color: 'text-gray-600 bg-gray-50 border-gray-200' },
  CANCELLED: { label: 'Cancelada', color: 'text-red-700 bg-red-50 border-red-200' },
  EXPIRED:   { label: 'Vencida',   color: 'text-red-700 bg-red-50 border-red-200' },
};

export default function ClientDashboardPage() {
  const navigate = useNavigate();
  const { user, can } = useAuthStore();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: bookingsData, isLoading: loadingBookings } = useMyBookings({ page: 1, limit: 10 });
  const { data: membership, isLoading: loadingMembership } = useMyMembership();

  const proximasReservas = (bookingsData?.data ?? []).filter((b) => {
    if (b.status === 'CANCELLED') return false;
    const slotDate = new Date(b.slot.date.slice(0, 10) + 'T12:00:00');
    slotDate.setHours(0, 0, 0, 0);
    return slotDate >= today;
  }).slice(0, 3);

  const firstName = user?.firstName ?? '';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';

  const membershipStatus = membership?.status ? MEMBERSHIP_STATUS_LABEL[membership.status] : null;

  return (
    <div className="space-y-6">
      {/* Bienvenida */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {greeting}{firstName ? `, ${firstName}` : ''}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">¿Listo para jugar?</p>
      </div>

      {/* Acciones rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <button
          onClick={() => navigate('/reservas/nueva')}
          className="card p-4 flex flex-col items-center gap-2 hover:border-primary-300 hover:bg-primary-50 transition-colors border border-gray-200 rounded-xl"
        >
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <PlusCircle className="w-5 h-5 text-primary-600" />
          </div>
          <span className="text-sm font-medium text-gray-700">Nueva reserva</span>
        </button>

        <button
          onClick={() => navigate('/mis-reservas')}
          className="card p-4 flex flex-col items-center gap-2 hover:border-blue-300 hover:bg-blue-50 transition-colors border border-gray-200 rounded-xl"
        >
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-blue-600" />
          </div>
          <span className="text-sm font-medium text-gray-700">Mis reservas</span>
        </button>

        <button
          onClick={() => navigate('/mis-pagos')}
          className="card p-4 flex flex-col items-center gap-2 hover:border-violet-300 hover:bg-violet-50 transition-colors border border-gray-200 rounded-xl"
        >
          <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
            <Receipt className="w-5 h-5 text-violet-600" />
          </div>
          <span className="text-sm font-medium text-gray-700">Mis pagos</span>
        </button>

        {can('wallet.view') && (
          <button
            onClick={() => navigate('/mi-wallet')}
            className="card p-4 flex flex-col items-center gap-2 hover:border-emerald-300 hover:bg-emerald-50 transition-colors border border-gray-200 rounded-xl"
          >
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">Mi wallet</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Próximas reservas */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              <h3 className="text-sm font-semibold text-gray-700">Próximas reservas</h3>
            </div>
            <button
              onClick={() => navigate('/mis-reservas')}
              className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
            >
              Ver todas <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {loadingBookings ? (
            <div className="flex justify-center py-8"><Spinner size="sm" /></div>
          ) : proximasReservas.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No tenés reservas próximas</p>
              <button
                onClick={() => navigate('/reservas/nueva')}
                className="mt-3 text-xs text-primary-600 font-medium hover:underline"
              >
                Reservar un turno
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {proximasReservas.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {booking.slot.venue?.name ?? '—'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDate(booking.slot.date)} · {booking.slot.startTime} – {booking.slot.endTime}
                    </p>
                  </div>
                  <StatusBadge status={booking.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Estado de membresía */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-violet-500" />
              <h3 className="text-sm font-semibold text-gray-700">Mi membresía</h3>
            </div>
            <button
              onClick={() => navigate('/mi-membresia')}
              className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
            >
              Ver detalle <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {loadingMembership ? (
            <div className="flex justify-center py-8"><Spinner size="sm" /></div>
          ) : !membership ? (
            <div className="px-5 py-8 text-center">
              <CreditCard className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Sin membresía activa</p>
            </div>
          ) : (
            <div className="px-5 py-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Estado</p>
                {membershipStatus && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${membershipStatus.color}`}>
                    {membershipStatus.label}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Reservas usadas este mes</p>
                <p className="text-sm font-semibold text-gray-900">
                  {membership.reservationsUsedMonth}
                </p>
              </div>
              {membership.endDate && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">Vence</p>
                  <p className="text-sm font-medium text-gray-700">
                    {new Date(membership.endDate).toLocaleDateString('es-AR')}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
