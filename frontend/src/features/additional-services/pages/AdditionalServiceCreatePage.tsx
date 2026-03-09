import { useNavigate } from 'react-router-dom';
import { usePageHeader } from '@/hooks/usePageHeader';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { useCreateAdditionalService } from '@/hooks/queries/useAdditionalServices';
import { useSportTypes } from '@/hooks/queries/useSportTypes';
import { Spinner } from '@components/ui/Spinner';
import { DetailSection } from '@components/ui/DetailSection';
import toast from 'react-hot-toast';

const schema = z.object({
  sportTypeId: z.string().uuid().optional().nullable(),
  name: z.string().min(1, 'El nombre es obligatorio'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'El precio debe ser mayor o igual a 0'),
  active: z.boolean(),
});

type FormData = z.infer<typeof schema>;

export default function AdditionalServiceCreatePage() {
  const navigate = useNavigate();
  usePageHeader({ subtitle: 'Crear nuevo servicio adicional' });

  const createService = useCreateAdditionalService();
  const { data: sportTypesData } = useSportTypes({ active: 'true', limit: 100 });

  const sportTypes = sportTypesData?.data ?? [];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      sportTypeId: null,
      active: true,
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await createService.mutateAsync({
        sportTypeId: data.sportTypeId || null,
        name: data.name,
        description: data.description || undefined,
        price: data.price,
        active: data.active,
      });
      toast.success('Servicio adicional creado exitosamente');
      navigate('/additional-services');
    } catch (error) {
      const message = (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Error al crear el servicio adicional';
      toast.error(message);
    }
  };

  return (
    <div>
      <button
        onClick={() => navigate('/additional-services')}
        className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Volver a Servicios Adicionales
      </button>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="px-6">
            <DetailSection title="Información" description="Datos del servicio adicional">
              <div className="space-y-4">
                <div>
                  <label htmlFor="sportTypeId" className="label">Tipo de deporte <span className="text-gray-400 font-normal">(opcional)</span></label>
                  <select id="sportTypeId" className="input" {...register('sportTypeId')}>
                    <option value="">General (todos los deportes)</option>
                    {sportTypes.map((st) => (
                      <option key={st.id} value={st.id}>{st.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="name" className="label">Nombre</label>
                  <input
                    id="name"
                    type="text"
                    className={`input ${errors.name ? 'input-error' : ''}`}
                    placeholder="Ej: Alquiler de raqueta"
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
                    placeholder="Descripción del servicio..."
                    {...register('description')}
                  />
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

            <DetailSection title="Precio" description="Costo del servicio adicional" noBorder>
              <div>
                <label htmlFor="price" className="label">Precio ($)</label>
                <input
                  id="price"
                  type="number"
                  min={0}
                  step={0.01}
                  className={`input ${errors.price ? 'input-error' : ''}`}
                  placeholder="0.00"
                  {...register('price')}
                />
                {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>}
              </div>
            </DetailSection>
          </div>

          <div className="px-6 pb-6 flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/additional-services')}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button type="submit" disabled={createService.isPending} className="btn-primary">
              {createService.isPending ? <Spinner size="sm" className="text-white" /> : 'Crear servicio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
