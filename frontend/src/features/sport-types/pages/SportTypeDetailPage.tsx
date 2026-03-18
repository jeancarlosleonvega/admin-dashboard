import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePageHeader } from '@/hooks/usePageHeader';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { useSportType, useUpdateSportType } from '@/hooks/queries/useSportTypes';
import { useAuthStore } from '@stores/authStore';
import { Spinner } from '@components/ui/Spinner';
import { DetailSection } from '@components/ui/DetailSection';
import toast from 'react-hot-toast';

const schema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(100),
  description: z.string().max(500).optional(),
  active: z.boolean(),
});

type FormData = z.infer<typeof schema>;

export default function SportTypeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { can } = useAuthStore();
  const canEdit = can('sport-types.manage');

  const { data: sportType, isLoading, isError } = useSportType(id!);
  const updateSportType = useUpdateSportType();
  usePageHeader({});

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (sportType) {
      reset({
        name: sportType.name,
        description: sportType.description ?? '',
        active: sportType.active,
      });
    }
  }, [sportType, reset]);

  const onSubmit = async (data: FormData) => {
    if (!id) return;
    try {
      await updateSportType.mutateAsync({ id, data });
      toast.success('Tipo de deporte actualizado exitosamente');
    } catch (error) {
      const message = (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Error al actualizar el tipo de deporte';
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

  if (isError || !sportType) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Tipo de deporte no encontrado</p>
        <button onClick={() => navigate('/tipos-deporte')} className="mt-4 text-blue-600 hover:underline">
          Volver a Tipos de Deporte
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => navigate('/tipos-deporte')}
        className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Volver a Tipos de Deporte
      </button>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="px-6">
            <DetailSection title="Información general" description="Nombre e identificación del tipo de deporte" noBorder>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="label">Nombre</label>
                  <input
                    id="name"
                    type="text"
                    className={`input ${errors.name ? 'input-error' : ''}`}
                    readOnly={!canEdit}
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
                    readOnly={!canEdit}
                    {...register('description')}
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={!canEdit}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      {...register('active')}
                    />
                    <span className="text-sm font-medium text-gray-700">Activo</span>
                  </label>
                </div>
              </div>
            </DetailSection>
          </div>

          {canEdit && (
            <div className="px-6 pb-6 flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={!isDirty || updateSportType.isPending}
                className="btn-primary disabled:opacity-50"
              >
                {updateSportType.isPending ? <Spinner size="sm" className="text-white" /> : 'Guardar cambios'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
