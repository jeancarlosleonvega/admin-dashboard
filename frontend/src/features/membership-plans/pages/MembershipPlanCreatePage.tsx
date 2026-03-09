import { useNavigate } from 'react-router-dom';
import { usePageHeader } from '@/hooks/usePageHeader';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { useCreateMembershipPlan } from '@/hooks/queries/useMembershipPlans';
import { useSportTypes } from '@/hooks/queries/useSportTypes';
import { Spinner } from '@components/ui/Spinner';
import { DetailSection } from '@components/ui/DetailSection';
import toast from 'react-hot-toast';

const schema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(100),
  description: z.string().max(500).optional(),
  price: z.coerce.number().min(0, 'El precio debe ser mayor o igual a 0'),
  monthlyReservationLimit: z.coerce.number().int().min(1).optional().nullable(),
  sportTypeId: z.string().uuid().optional().nullable(),
  active: z.boolean(),
});

type FormData = z.infer<typeof schema>;

export default function MembershipPlanCreatePage() {
  const navigate = useNavigate();
  usePageHeader({ subtitle: 'Crear nuevo plan de membresía' });
  const createPlan = useCreateMembershipPlan();
  const { data: sportTypesData } = useSportTypes({ active: 'true', limit: 100 });

  const sportTypes = sportTypesData?.data ?? [];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      active: true,
      price: 0,
      sportTypeId: null,
      monthlyReservationLimit: null,
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await createPlan.mutateAsync({
        name: data.name,
        price: data.price,
        active: data.active,
        ...(data.description ? { description: data.description } : {}),
        ...(data.sportTypeId ? { sportTypeId: data.sportTypeId } : {}),
        ...(data.monthlyReservationLimit != null ? { monthlyReservationLimit: data.monthlyReservationLimit } : {}),
      });
      toast.success('Plan de membresía creado exitosamente');
      navigate('/membership-plans');
    } catch (error) {
      const message = (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Error al crear el plan';
      toast.error(message);
    }
  };

  return (
    <div>
      <button
        onClick={() => navigate('/membership-plans')}
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
                    placeholder="Ej: Plan Básico, Plan Premium"
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
                    placeholder="Descripción del plan"
                    {...register('description')}
                  />
                </div>
              </div>
            </DetailSection>

            <DetailSection title="Precios y límites" description="Configuración económica del plan" noBorder>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="price" className="label">Precio</label>
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
                    <label htmlFor="monthlyReservationLimit" className="label">Límite mensual <span className="text-gray-400 font-normal">(opcional)</span></label>
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
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      {...register('active')}
                    />
                    <span className="text-sm font-medium text-gray-700">Activo</span>
                  </label>
                </div>
              </div>
            </DetailSection>
          </div>

          <div className="px-6 pb-6 flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/membership-plans')}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button type="submit" disabled={createPlan.isPending} className="btn-primary">
              {createPlan.isPending ? <Spinner size="sm" className="text-white" /> : 'Crear plan de membresía'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
