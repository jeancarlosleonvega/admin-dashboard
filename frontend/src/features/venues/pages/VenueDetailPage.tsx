import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePageHeader } from '@/hooks/usePageHeader';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { useVenue, useUpdateVenue } from '@/hooks/queries/useVenues';
import { useSportTypes } from '@/hooks/queries/useSportTypes';
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
  sportTypeId: z.string().uuid(),
  name: z.string().min(1, 'El nombre es obligatorio').max(100),
  description: z.string().max(500).optional(),
  intervalMinutes: z.coerce.number().int().min(5).max(120).optional().nullable(),
  playersPerSlot: z.coerce.number().int().min(1).max(20).optional().nullable(),
  openTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  enabledDays: z.array(z.coerce.number().int().min(1).max(7)).optional(),
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
    control,
    watch,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const selectedSportTypeId = watch('sportTypeId');
  const selectedSportType = sportTypes.find((s) => s.id === selectedSportTypeId);

  useEffect(() => {
    if (venue) {
      reset({
        sportTypeId: venue.sportTypeId,
        name: venue.name,
        description: venue.description ?? '',
        intervalMinutes: venue.intervalMinutes ?? null,
        playersPerSlot: venue.playersPerSlot ?? null,
        openTime: venue.openTime ?? null,
        closeTime: venue.closeTime ?? null,
        enabledDays: venue.enabledDays ?? [],
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
              </div>
            </DetailSection>

            <DetailSection title="Configuración (opcional)" description="Sobreescribí los valores heredados del tipo de deporte">
              <div className="space-y-4">
                {selectedSportType && (
                  <p className="text-xs text-blue-600">Los campos vacíos usarán los valores del tipo de deporte seleccionado</p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="intervalMinutes" className="label">
                      Intervalo (min)
                      {selectedSportType && (
                        <span className="ml-1 text-xs text-gray-400">por defecto: {selectedSportType.defaultIntervalMinutes}</span>
                      )}
                    </label>
                    <input
                      id="intervalMinutes"
                      type="number"
                      min={5}
                      max={120}
                      className="input"
                      readOnly={!canEdit}
                      {...register('intervalMinutes')}
                    />
                  </div>
                  <div>
                    <label htmlFor="playersPerSlot" className="label">
                      Jugadores por turno
                      {selectedSportType && (
                        <span className="ml-1 text-xs text-gray-400">por defecto: {selectedSportType.defaultPlayersPerSlot}</span>
                      )}
                    </label>
                    <input
                      id="playersPerSlot"
                      type="number"
                      min={1}
                      max={20}
                      className="input"
                      readOnly={!canEdit}
                      {...register('playersPerSlot')}
                    />
                  </div>
                  <div>
                    <label htmlFor="openTime" className="label">
                      Hora de apertura
                      {selectedSportType && (
                        <span className="ml-1 text-xs text-gray-400">por defecto: {selectedSportType.defaultOpenTime}</span>
                      )}
                    </label>
                    <input
                      id="openTime"
                      type="time"
                      className="input"
                      readOnly={!canEdit}
                      {...register('openTime')}
                    />
                  </div>
                  <div>
                    <label htmlFor="closeTime" className="label">
                      Hora de cierre
                      {selectedSportType && (
                        <span className="ml-1 text-xs text-gray-400">por defecto: {selectedSportType.defaultCloseTime}</span>
                      )}
                    </label>
                    <input
                      id="closeTime"
                      type="time"
                      className="input"
                      readOnly={!canEdit}
                      {...register('closeTime')}
                    />
                  </div>
                </div>
              </div>
            </DetailSection>

            <DetailSection title="Días habilitados" description="Días de la semana en que este espacio opera" noBorder>
              <div>
                <Controller
                  name="enabledDays"
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
