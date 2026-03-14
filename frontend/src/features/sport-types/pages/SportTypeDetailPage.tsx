import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePageHeader } from '@/hooks/usePageHeader';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { useSportType, useUpdateSportType } from '@/hooks/queries/useSportTypes';
import { useAuthStore } from '@stores/authStore';
import { Spinner } from '@components/ui/Spinner';
import { DetailSection } from '@components/ui/DetailSection';
import toast from 'react-hot-toast';

const DAYS = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 7, label: 'Domingo' },
];

const schema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(100),
  description: z.string().max(500).optional(),
  defaultIntervalMinutes: z.coerce.number().int().min(5).max(120),
  defaultPlayersPerSlot: z.coerce.number().int().min(1).max(20),
  defaultMemberPrice: z.coerce.number().min(0),
  defaultNonMemberPrice: z.coerce.number().min(0),
  defaultOpenTime: z.string().regex(/^\d{2}:\d{2}$/),
  defaultCloseTime: z.string().regex(/^\d{2}:\d{2}$/),
  defaultEnabledDays: z.array(z.coerce.number().int().min(1).max(7)).min(1),
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
    control,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (sportType) {
      reset({
        name: sportType.name,
        description: sportType.description ?? '',
        defaultIntervalMinutes: sportType.defaultIntervalMinutes,
        defaultPlayersPerSlot: sportType.defaultPlayersPerSlot,
        defaultMemberPrice: (sportType as unknown as { defaultMemberPrice?: number }).defaultMemberPrice ?? 0,
        defaultNonMemberPrice: sportType.defaultNonMemberPrice ?? 0,
        defaultOpenTime: sportType.defaultOpenTime,
        defaultCloseTime: sportType.defaultCloseTime,
        defaultEnabledDays: sportType.defaultEnabledDays,
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
            <DetailSection title="Información general" description="Nombre e identificación del tipo de deporte">
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
              </div>
            </DetailSection>

            <DetailSection title="Configuración por defecto" description="Valores predeterminados que heredan los espacios de este tipo">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="defaultIntervalMinutes" className="label">Intervalo (minutos)</label>
                    <input
                      id="defaultIntervalMinutes"
                      type="number"
                      min={5}
                      max={120}
                      className={`input ${errors.defaultIntervalMinutes ? 'input-error' : ''}`}
                      readOnly={!canEdit}
                      {...register('defaultIntervalMinutes')}
                    />
                    {errors.defaultIntervalMinutes && <p className="mt-1 text-sm text-red-600">{errors.defaultIntervalMinutes.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="defaultPlayersPerSlot" className="label">Jugadores por turno</label>
                    <input
                      id="defaultPlayersPerSlot"
                      type="number"
                      min={1}
                      max={20}
                      className={`input ${errors.defaultPlayersPerSlot ? 'input-error' : ''}`}
                      readOnly={!canEdit}
                      {...register('defaultPlayersPerSlot')}
                    />
                    {errors.defaultPlayersPerSlot && <p className="mt-1 text-sm text-red-600">{errors.defaultPlayersPerSlot.message}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="defaultMemberPrice" className="label">Precio para socios</label>
                    <input
                      id="defaultMemberPrice"
                      type="number"
                      min={0}
                      step="0.01"
                      className={`input ${errors.defaultMemberPrice ? 'input-error' : ''}`}
                      readOnly={!canEdit}
                      {...register('defaultMemberPrice')}
                    />
                    {errors.defaultMemberPrice && <p className="mt-1 text-sm text-red-600">{errors.defaultMemberPrice.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="defaultNonMemberPrice" className="label">Precio para no socios</label>
                    <input
                      id="defaultNonMemberPrice"
                      type="number"
                      min={0}
                      step="0.01"
                      className={`input ${errors.defaultNonMemberPrice ? 'input-error' : ''}`}
                      readOnly={!canEdit}
                      {...register('defaultNonMemberPrice')}
                    />
                    {errors.defaultNonMemberPrice && <p className="mt-1 text-sm text-red-600">{errors.defaultNonMemberPrice.message}</p>}
                  </div>
                </div>
              </div>
            </DetailSection>

            <DetailSection title="Horario por defecto" description="Horario de apertura y cierre para este tipo de deporte">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="defaultOpenTime" className="label">Hora de apertura</label>
                  <input
                    id="defaultOpenTime"
                    type="time"
                    className={`input ${errors.defaultOpenTime ? 'input-error' : ''}`}
                    readOnly={!canEdit}
                    {...register('defaultOpenTime')}
                  />
                  {errors.defaultOpenTime && <p className="mt-1 text-sm text-red-600">{errors.defaultOpenTime.message}</p>}
                </div>
                <div>
                  <label htmlFor="defaultCloseTime" className="label">Hora de cierre</label>
                  <input
                    id="defaultCloseTime"
                    type="time"
                    className={`input ${errors.defaultCloseTime ? 'input-error' : ''}`}
                    readOnly={!canEdit}
                    {...register('defaultCloseTime')}
                  />
                  {errors.defaultCloseTime && <p className="mt-1 text-sm text-red-600">{errors.defaultCloseTime.message}</p>}
                </div>
              </div>
            </DetailSection>

            <DetailSection title="Días habilitados" description="Días de la semana en que este tipo de deporte opera" noBorder>
              <div>
                <Controller
                  name="defaultEnabledDays"
                  control={control}
                  render={({ field }) => (
                    <div className="flex flex-wrap gap-2">
                      {DAYS.map((day) => {
                        const checked = field.value?.includes(day.value);
                        return (
                          <label key={day.value} className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={!canEdit}
                              onChange={() => {
                                if (!canEdit) return;
                                const current = field.value ?? [];
                                if (checked) {
                                  field.onChange(current.filter((d) => d !== day.value));
                                } else {
                                  field.onChange([...current, day.value].sort());
                                }
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">{day.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                />
                {errors.defaultEnabledDays && <p className="mt-1 text-sm text-red-600">{errors.defaultEnabledDays.message}</p>}
                <div className="mt-4">
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
