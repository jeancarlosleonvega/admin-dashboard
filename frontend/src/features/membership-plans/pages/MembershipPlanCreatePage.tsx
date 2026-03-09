import { useNavigate } from 'react-router-dom';
import { usePageHeader } from '@/hooks/usePageHeader';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { useCreateMembershipPlan } from '@/hooks/queries/useMembershipPlans';
import { useSportTypes } from '@/hooks/queries/useSportTypes';
import { Spinner } from '@components/ui/Spinner';
import toast from 'react-hot-toast';

const schema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100),
  description: z.string().max(500).optional(),
  price: z.coerce.number().min(0, 'El precio no puede ser negativo'),
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

      <div className="card p-6 max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label htmlFor="name" className="label">Nombre *</label>
            <input
              id="name"
              type="text"
              className={`input ${errors.name ? 'input-error' : ''}`}
              {...register('name')}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </div>

          <div>
            <label htmlFor="description" className="label">Descripción</label>
            <textarea id="description" rows={3} className="input" {...register('description')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="price" className="label">Precio *</label>
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
              <label htmlFor="monthlyReservationLimit" className="label">Límite mensual de reservas</label>
              <input
                id="monthlyReservationLimit"
                type="number"
                min={1}
                placeholder="Sin límite"
                className="input"
                {...register('monthlyReservationLimit')}
              />
              <p className="mt-1 text-xs text-gray-500">Dejar vacío para sin límite</p>
            </div>
          </div>

          <div>
            <label htmlFor="sportTypeId" className="label">Tipo de Deporte</label>
            <select id="sportTypeId" className="input" {...register('sportTypeId')}>
              <option value="">Sin deporte específico</option>
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

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => navigate('/membership-plans')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button type="submit" disabled={createPlan.isPending} className="btn-primary">
              {createPlan.isPending ? <Spinner size="sm" className="text-white" /> : 'Crear Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
