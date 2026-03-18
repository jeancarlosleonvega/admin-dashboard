import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePageHeader } from '@/hooks/usePageHeader';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { useVenue, useUpdateVenue } from '@/hooks/queries/useVenues';
import { useSportTypes } from '@/hooks/queries/useSportTypes';
import { useAuthStore } from '@stores/authStore';
import { Spinner } from '@components/ui/Spinner';
import { DetailSection } from '@components/ui/DetailSection';
import toast from 'react-hot-toast';

const DAY_NAMES: Record<number, string> = {
  1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 7: 'Domingo',
};

const schema = z.object({
  sportTypeId: z.string().uuid(),
  name: z.string().min(1, 'El nombre es obligatorio').max(100),
  description: z.string().max(500).optional(),
  active: z.boolean(),
});

type FormData = z.infer<typeof schema>;

export default function VenueDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { can } = useAuthStore();
  const canEdit = can('venues.manage');

  const { data: venue, isLoading, isError } = useVenue(id!);
  const { data: sportTypesData } = useSportTypes({ active: 'true', limit: 100 });
  const updateVenue = useUpdateVenue();
  usePageHeader({});

  const sportTypes = sportTypesData?.data ?? [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (venue) {
      reset({
        sportTypeId: venue.sportTypeId,
        name: venue.name,
        description: venue.description ?? '',
        active: venue.active,
      });
    }
  }, [venue, reset]);

  const onSubmit = async (data: FormData) => {
    if (!id) return;
    try {
      await updateVenue.mutateAsync({ id, data });
      toast.success('Espacio actualizado exitosamente');
    } catch (error) {
      const message = (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Error al actualizar el espacio';
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

  if (isError || !venue) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Espacio no encontrado</p>
        <button onClick={() => navigate('/espacios')} className="mt-4 text-blue-600 hover:underline">
          Volver a Espacios
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => navigate('/espacios')}
        className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Volver a Espacios
      </button>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="px-6">
            <DetailSection title="Información general" description="Datos principales del espacio">
              <div className="space-y-4">
                <div>
                  <label htmlFor="sportTypeId" className="label">Tipo de deporte</label>
                  <select
                    id="sportTypeId"
                    className={`input ${errors.sportTypeId ? 'input-error' : ''}`}
                    disabled={!canEdit}
                    {...register('sportTypeId')}
                  >
                    <option value="">Seleccioná...</option>
                    {sportTypes.map((st) => (
                      <option key={st.id} value={st.id}>{st.name}</option>
                    ))}
                  </select>
                  {errors.sportTypeId && <p className="mt-1 text-sm text-red-600">{errors.sportTypeId.message}</p>}
                </div>
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

            {venue.operatingHours && venue.operatingHours.length > 0 && (
              <DetailSection title="Horarios de operación" description="Franjas horarias configuradas para este espacio" noBorder>
                <div className="space-y-3">
                  {venue.operatingHours.map((oh) => (
                    <div key={oh.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-sm font-medium text-gray-700">
                          {oh.openTime} — {oh.closeTime}
                        </span>
                        <div className="flex gap-1">
                          {oh.daysOfWeek.map((d) => (
                            <span key={d} className="px-1.5 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-700">
                              {DAY_NAMES[d]?.slice(0, 2) ?? d}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-gray-400">
                  Para editar los horarios de operación, usá la opción "Editar espacio".
                </p>
              </DetailSection>
            )}
          </div>

          {canEdit && (
            <div className="px-6 pb-6 flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={!isDirty || updateVenue.isPending}
                className="btn-primary disabled:opacity-50"
              >
                {updateVenue.isPending ? <Spinner size="sm" className="text-white" /> : 'Guardar cambios'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
