import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePageHeader } from '@/hooks/usePageHeader';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { useMembershipPlan, useUpdateMembershipPlan } from '@/hooks/queries/useMembershipPlans';
import { useSportTypes } from '@/hooks/queries/useSportTypes';
import { Spinner } from '@components/ui/Spinner';
import { DetailSection } from '@components/ui/DetailSection';
import toast from 'react-hot-toast';

const schema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(100),
  description: z.string().max(500).optional(),
  price: z.coerce.number().min(0, 'El precio debe ser mayor o igual a 0'),
  baseBookingPrice: z.coerce.number().min(0, 'El precio debe ser mayor o igual a 0'),
  monthlyReservationLimit: z.coerce.number().int().min(1).optional().nullable(),
  sportTypeId: z.string().uuid().optional().nullable(),
  active: z.boolean(),
  walletCreditEnabled: z.boolean(),
  walletCreditAmount: z.coerce.number().min(0).optional().nullable(),
  walletPaymentEnabled: z.boolean(),
});

type FormData = z.infer<typeof schema>;

export default function MembershipPlanEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  usePageHeader({ subtitle: 'Editar plan de membresía' });
  const { data: plan, isLoading, isError } = useMembershipPlan(id!);
  const { data: sportTypesData } = useSportTypes({ active: 'true', limit: 100 });
  const updatePlan = useUpdateMembershipPlan();

  const sportTypes = sportTypesData?.data ?? [];

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const walletCreditEnabled = watch('walletCreditEnabled');

  useEffect(() => {
    if (plan) {
      const p = plan as typeof plan & {
        baseBookingPrice?: number;
        walletCreditEnabled?: boolean;
        walletCreditAmount?: number | null;
        walletPaymentEnabled?: boolean;
      };
      reset({
        name: p.name,
        description: p.description ?? '',
        price: Number(p.price),
        baseBookingPrice: Number(p.baseBookingPrice ?? 0),
        monthlyReservationLimit: p.monthlyReservationLimit ?? null,
        sportTypeId: p.sportTypeId ?? null,
        active: p.active,
        walletCreditEnabled: p.walletCreditEnabled ?? false,
        walletCreditAmount: p.walletCreditAmount != null ? Number(p.walletCreditAmount) : null,
        walletPaymentEnabled: p.walletPaymentEnabled ?? false,
      });
    }
  }, [plan, reset]);

  const onSubmit = async (data: FormData) => {
    if (!id) return;
    try {
      await updatePlan.mutateAsync({ id, data });
      toast.success('Plan de membresía actualizado exitosamente');
      navigate('/planes-membresia');
    } catch (error) {
      const message = (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Error al actualizar el plan';
      toast.error(message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !plan) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Plan no encontrado</p>
        <button onClick={() => navigate('/planes-membresia')} className="mt-4 text-blue-600 hover:underline">
          Volver a Planes
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => navigate('/planes-membresia')}
        className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Volver a Planes de Membresía
      </button>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="px-6">
            <DetailSection title="Información" description="Nombre y descripción del plan">
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="label">Nombre</label>
                  <input
                    id="name"
                    type="text"
                    className={`input ${errors.name ? 'input-error' : ''}`}
                    {...register('name')}
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
                </div>
                <div>
                  <label htmlFor="description" className="label">Descripción <span className="text-gray-400 font-normal">(opcional)</span></label>
                  <textarea
                    id="description"
                    rows={3}
                    className="input"
                    {...register('description')}
                  />
                </div>
              </div>
            </DetailSection>

            <DetailSection title="Precios y límites" description="Precio mensual, precio base de reserva y límites">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="price" className="label">Precio mensualidad</label>
                    <input
                      id="price"
                      type="number"
                      min={0}
                      step="0.01"
                      className={`input ${errors.price ? 'input-error' : ''}`}
                      {...register('price')}
                    />
                    {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="baseBookingPrice" className="label">Precio base de reserva</label>
                    <input
                      id="baseBookingPrice"
                      type="number"
                      min={0}
                      step="0.01"
                      className={`input ${errors.baseBookingPrice ? 'input-error' : ''}`}
                      {...register('baseBookingPrice')}
                    />
                    {errors.baseBookingPrice && <p className="mt-1 text-sm text-red-600">{errors.baseBookingPrice.message}</p>}
                    <p className="mt-1 text-xs text-gray-500">Precio de fallback cuando no hay regla específica en el horario</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="monthlyReservationLimit" className="label">Límite mensual de reservas <span className="text-gray-400 font-normal">(opcional)</span></label>
                    <input
                      id="monthlyReservationLimit"
                      type="number"
                      min={1}
                      placeholder="Sin límite"
                      className="input"
                      {...register('monthlyReservationLimit')}
                    />
                    <p className="mt-1 text-xs text-gray-500">Dejá vacío para sin límite</p>
                  </div>
                  <div>
                    <label htmlFor="sportTypeId" className="label">Tipo de deporte <span className="text-gray-400 font-normal">(opcional)</span></label>
                    <select id="sportTypeId" className="input" {...register('sportTypeId')}>
                      <option value="">Todos los deportes</option>
                      {sportTypes.map((st) => (
                        <option key={st.id} value={st.id}>{st.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </DetailSection>

            <DetailSection title="Wallet" description="Configuración de acreditación y uso de saldo wallet">
              <div className="space-y-4">
                <div className="flex flex-col gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      {...register('walletCreditEnabled')}
                    />
                    <span className="text-sm font-medium text-gray-700">Acreditar saldo al pagar mensualidad</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      {...register('walletPaymentEnabled')}
                    />
                    <span className="text-sm font-medium text-gray-700">Permitir pago con wallet al reservar</span>
                  </label>
                </div>
                {walletCreditEnabled && (
                  <div>
                    <label htmlFor="walletCreditAmount" className="label">Monto a acreditar en wallet</label>
                    <input
                      id="walletCreditAmount"
                      type="number"
                      min={0}
                      step="0.01"
                      className={`input ${errors.walletCreditAmount ? 'input-error' : ''}`}
                      {...register('walletCreditAmount')}
                    />
                    {errors.walletCreditAmount && <p className="mt-1 text-sm text-red-600">{errors.walletCreditAmount.message}</p>}
                    <p className="mt-1 text-xs text-gray-500">Monto que se acredita en la wallet del socio al pagar la mensualidad</p>
                  </div>
                )}
              </div>
            </DetailSection>

            <DetailSection title="Estado" description="" noBorder>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  {...register('active')}
                />
                <span className="text-sm font-medium text-gray-700">Activo</span>
              </label>
            </DetailSection>
          </div>

          <div className="px-6 pb-6 flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/planes-membresia')}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button type="submit" disabled={updatePlan.isPending} className="btn-primary">
              {updatePlan.isPending ? <Spinner size="sm" className="text-white" /> : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
