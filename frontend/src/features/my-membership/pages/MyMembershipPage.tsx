import { usePageHeader } from '@/hooks/usePageHeader';
import { useQuery } from '@tanstack/react-query';
import { userMembershipsApi } from '@api/userMemberships.api';
import { Spinner } from '@components/ui/Spinner';
import { DetailSection } from '@components/ui/DetailSection';
import { CheckCircle } from 'lucide-react';
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
  usePageHeader({});

  const { data: membership, isLoading } = useQuery({
    queryKey: ['my-membership'],
    queryFn: () => userMembershipsApi.getMyMembership(),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!membership) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-12 text-center text-gray-500">
          <p className="text-base font-medium text-gray-900">Sin membresía activa</p>
          <p className="text-sm mt-1">No tenés ningún plan de membresía asignado actualmente.</p>
        </div>
      </div>
    );
  }

  const plan = membership.membershipPlan;
  const limit = plan.monthlyReservationLimit;
  const used = membership.reservationsUsedMonth;
  const progressPct = limit ? Math.min((used / limit) * 100, 100) : 0;

  return (
    <div>
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 pb-6">
          <DetailSection title="Plan" description="Datos del plan de membresía asignado.">
            <div className="space-y-4">
              <div>
                <label className="label">Nombre del plan</label>
                <input type="text" className="input bg-gray-50" value={plan.name} readOnly />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Estado</label>
                  <div className="mt-1">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLOR[membership.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABEL[membership.status] ?? membership.status}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="label">Precio del plan</label>
                  <input
                    type="text"
                    className="input bg-gray-50"
                    value={Number(plan.price) === 0 ? 'Sin costo' : `$${Number(plan.price).toLocaleString()}`}
                    readOnly
                  />
                </div>
              </div>
              {membership.notes && (
                <div>
                  <label className="label">Notas</label>
                  <textarea className="input bg-gray-50 resize-none" rows={2} value={membership.notes} readOnly />
                </div>
              )}
            </div>
          </DetailSection>

          <DetailSection title="Vigencia" description="Período de validez de la membresía.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Fecha de inicio</label>
                <input type="text" className="input bg-gray-50" value={formatDate(membership.startDate)} readOnly />
              </div>
              <div>
                <label className="label">Fecha de vencimiento</label>
                <input
                  type="text"
                  className="input bg-gray-50"
                  value={membership.endDate ? formatDate(membership.endDate) : 'Sin vencimiento'}
                  readOnly
                />
              </div>
            </div>
          </DetailSection>

          <DetailSection title="Uso mensual" description="Cantidad de reservas realizadas este mes." noBorder>
            {limit !== null ? (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Reservas este mes</span>
                  <span className="font-semibold text-gray-900">{used} / {limit}</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${progressPct >= 100 ? 'bg-red-500' : progressPct >= 75 ? 'bg-orange-400' : 'bg-green-500'}`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  {limit - used > 0 ? `${limit - used} reservas disponibles` : 'Límite mensual alcanzado'}
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-green-700">
                <CheckCircle className="w-4 h-4" />
                <span>Sin límite de reservas mensuales</span>
              </div>
            )}
          </DetailSection>
        </div>
      </div>
    </div>
  );
}
