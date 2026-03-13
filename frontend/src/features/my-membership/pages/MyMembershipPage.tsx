import { usePageHeader } from '@/hooks/usePageHeader';
import { useQuery } from '@tanstack/react-query';
import { userMembershipsApi } from '@api/userMemberships.api';
import { Spinner } from '@components/ui/Spinner';
import { CreditCard, Calendar, CheckCircle } from 'lucide-react';
import { formatDate } from '@lib/formatDate';

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Activa',
  INACTIVE: 'Inactiva',
  CANCELLED: 'Cancelada',
  EXPIRED: 'Vencida',
};

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  INACTIVE: 'bg-gray-100 text-gray-600',
  CANCELLED: 'bg-red-100 text-red-700',
  EXPIRED: 'bg-orange-100 text-orange-700',
};

export default function MyMembershipPage() {
  usePageHeader({ subtitle: 'Tu membresía activa' });

  const { data: membership, isLoading } = useQuery({
    queryKey: ['my-membership'],
    queryFn: () => userMembershipsApi.getMyMembership(),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!membership) {
    return (
      <div className="max-w-lg">
        <div className="card p-10 text-center space-y-4">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <CreditCard className="w-7 h-7 text-gray-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Sin membresía activa</h2>
            <p className="text-sm text-gray-500 mt-1">
              No tenés ningún plan de membresía asignado actualmente.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const plan = membership.membershipPlan;
  const limit = plan.monthlyReservationLimit;
  const used = membership.reservationsUsedMonth;
  const progressPct = limit ? Math.min((used / limit) * 100, 100) : 0;

  return (
    <div className="max-w-lg space-y-4">
      {/* Card principal */}
      <div className="card p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{plan.name}</h2>
            <span
              className={`inline-flex mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLOR[membership.status] ?? 'bg-gray-100 text-gray-600'}`}
            >
              {STATUS_LABEL[membership.status] ?? membership.status}
            </span>
          </div>
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-blue-600" />
          </div>
        </div>

        {/* Fechas */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-gray-500">Inicio</p>
              <p className="font-medium text-gray-900">{formatDate(membership.startDate)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-gray-500">Vencimiento</p>
              <p className="font-medium text-gray-900">
                {membership.endDate ? formatDate(membership.endDate) : 'Sin vencimiento'}
              </p>
            </div>
          </div>
        </div>

        {/* Uso mensual */}
        {limit !== null ? (
          <div>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-gray-600">Reservas este mes</span>
              <span className="font-semibold text-gray-900">
                {used} / {limit}
              </span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${progressPct >= 100 ? 'bg-red-500' : progressPct >= 75 ? 'bg-orange-400' : 'bg-green-500'}`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {limit - used > 0 ? `${limit - used} reservas disponibles` : 'Límite mensual alcanzado'}
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-green-700">
            <CheckCircle className="w-4 h-4" />
            <span>Sin límite de reservas mensuales</span>
          </div>
        )}

        {/* Notas */}
        {membership.notes && (
          <p className="text-sm text-gray-500 border-t border-gray-100 pt-4">{membership.notes}</p>
        )}
      </div>

      {/* Precio */}
      <div className="card p-4 flex items-center justify-between text-sm">
        <span className="text-gray-500">Precio del plan</span>
        <span className="font-semibold text-gray-900">
          {Number(plan.price) === 0 ? 'Sin costo' : `$${Number(plan.price).toLocaleString()}`}
        </span>
      </div>
    </div>
  );
}
