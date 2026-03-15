import { useState } from 'react';
import { usePageHeader } from '@/hooks/usePageHeader';
import { useQuery } from '@tanstack/react-query';
import { userMembershipsApi } from '@api/userMemberships.api';
import type { ActiveMembershipPlan } from '@api/userMemberships.api';
import { Spinner } from '@components/ui/Spinner';
import { DetailSection } from '@components/ui/DetailSection';
import StatusBadge from '@components/shared/StatusBadge';
import { CheckCircle, CreditCard } from 'lucide-react';
import { formatDate } from '@lib/formatDate';
import toast from 'react-hot-toast';

// ─── Vista de planes para contratar ──────────────────────────────────────────

function PlanCard({ plan, onSubscribe, isLoading }: {
  plan: ActiveMembershipPlan;
  onSubscribe: (id: string) => void;
  isLoading: boolean;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col gap-4 shadow-sm hover:border-blue-300 transition-colors">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
        {plan.sportType && (
          <p className="text-sm text-gray-500 mt-0.5">{plan.sportType.name}</p>
        )}
        {plan.description && (
          <p className="text-sm text-gray-600 mt-2">{plan.description}</p>
        )}
      </div>

      <div className="flex items-end gap-1">
        <span className="text-3xl font-bold text-gray-900">
          ${Number(plan.price).toLocaleString('es-AR')}
        </span>
        <span className="text-sm text-gray-500 mb-1">/mes</span>
      </div>

      <ul className="space-y-1.5 text-sm text-gray-600">
        {plan.monthlyReservationLimit !== null ? (
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
            {plan.monthlyReservationLimit} reservas por mes
          </li>
        ) : (
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
            Reservas ilimitadas
          </li>
        )}
        <li className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
          Renovación automática mensual
        </li>
      </ul>

      <button
        onClick={() => onSubscribe(plan.id)}
        disabled={isLoading}
        className="w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
      >
        {isLoading ? <Spinner size="sm" className="text-white" /> : <CreditCard className="w-4 h-4" />}
        Contratar con MercadoPago
      </button>
    </div>
  );
}

function PlansView() {
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);

  const { data: plans, isLoading } = useQuery({
    queryKey: ['membership-plans-active'],
    queryFn: () => userMembershipsApi.getActivePlans(),
  });

  const handleSubscribe = async (planId: string) => {
    setLoadingPlanId(planId);
    try {
      const { initPoint } = await userMembershipsApi.subscribe(planId);
      window.location.href = initPoint;
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message ?? 'Error al iniciar el pago';
      toast.error(msg);
      setLoadingPlanId(null);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  }

  if (!plans || plans.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm px-6 py-12 text-center text-gray-500">
        <p className="text-base font-medium text-gray-900">No hay planes disponibles</p>
        <p className="text-sm mt-1">Contactá con recepción para obtener más información.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Planes disponibles</h2>
        <p className="text-sm text-gray-500 mt-1">Elegí un plan y pagá con MercadoPago. La membresía se activa automáticamente.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            onSubscribe={handleSubscribe}
            isLoading={loadingPlanId === plan.id}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Vista de membresía activa ────────────────────────────────────────────────

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

  // Sin membresía o membresía cancelada: mostrar planes
  if (!membership || membership.status === 'CANCELLED' || membership.status === 'EXPIRED') {
    return <PlansView />;
  }

  // Membresía pendiente de pago
  if (membership.status === 'PENDING') {
    return (
      <div className="bg-white rounded-lg border border-yellow-200 shadow-sm">
        <div className="px-6 py-8 text-center">
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-6 h-6 text-yellow-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Pago pendiente</h3>
          <p className="text-sm text-gray-500 mt-2 mb-6">
            Tu suscripción está siendo procesada. Una vez aprobado el pago en MercadoPago, tu membresía se activará automáticamente.
          </p>
          <StatusBadge status="PENDING" />
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
                    <StatusBadge status={membership.status} />
                  </div>
                </div>
                <div>
                  <label className="label">Precio del plan</label>
                  <input
                    type="text"
                    className="input bg-gray-50"
                    value={Number(plan.price) === 0 ? 'Sin costo' : `$${Number(plan.price).toLocaleString('es-AR')}/mes`}
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

      {/* Texto informativo sobre la suscripción MP */}
      {membership.status === 'ACTIVE' && (membership as any).mpSubscriptionId && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-700">
          Tu membresía se renueva automáticamente cada mes a través de MercadoPago.
          Para cancelar la suscripción, hacelo directamente desde tu cuenta de MercadoPago.
        </div>
      )}
    </div>
  );
}
