import { useNavigate, useParams } from 'react-router-dom';
import { usePageHeader } from '@/hooks/usePageHeader';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useVenue, useUpdateVenue } from '@/hooks/queries/useVenues';
import { useSportTypes } from '@/hooks/queries/useSportTypes';
import { Spinner } from '@components/ui/Spinner';
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
  sportTypeId: z.string().uuid('Selecciona un tipo de deporte'),
  name: z.string().min(1, 'El nombre es requerido').max(100),
  description: z.string().max(500).optional(),
  intervalMinutes: z.coerce.number().int().min(5).max(120).optional().nullable(),
  playersPerSlot: z.coerce.number().int().min(1).max(20).optional().nullable(),
  openTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  enabledDays: z.array(z.coerce.number().int().min(1).max(7)).optional(),
  active: z.boolean(),
});

type FormData = z.infer<typeof schema>;

export default function VenueEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  usePageHeader({ subtitle: 'Editar espacio' });
  const { data: venue, isLoading, isError } = useVenue(id!);
  const { data: sportTypesData } = useSportTypes({ active: 'true', limit: 100 });
  const updateVenue = useUpdateVenue();

  const sportTypes = sportTypesData?.data ?? [];

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
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
      navigate('/venues');
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
        <button onClick={() => navigate('/venues')} className="mt-4 text-blue-600 hover:underline">
          Volver a Espacios
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => navigate('/venues')}
        className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Volver a Espacios
      </button>

      <div className="card p-6 max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label htmlFor="sportTypeId" className="label">Tipo de Deporte *</label>
            <select
              id="sportTypeId"
              className={`input ${errors.sportTypeId ? 'input-error' : ''}`}
              {...register('sportTypeId')}
            >
              <option value="">Seleccionar tipo de deporte</option>
              {sportTypes.map((st) => (
                <option key={st.id} value={st.id}>{st.name}</option>
              ))}
            </select>
            {errors.sportTypeId && <p className="mt-1 text-sm text-red-600">{errors.sportTypeId.message}</p>}
          </div>

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
                placeholder={selectedSportType ? String(selectedSportType.defaultIntervalMinutes) : ''}
                className="input"
                {...register('intervalMinutes')}
              />
            </div>
            <div>
              <label htmlFor="playersPerSlot" className="label">
                Jugadores por slot
                {selectedSportType && (
                  <span className="ml-1 text-xs text-gray-400">por defecto: {selectedSportType.defaultPlayersPerSlot}</span>
                )}
              </label>
              <input
                id="playersPerSlot"
                type="number"
                min={1}
                max={20}
                placeholder={selectedSportType ? String(selectedSportType.defaultPlayersPerSlot) : ''}
                className="input"
                {...register('playersPerSlot')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="openTime" className="label">
                Hora de apertura
                {selectedSportType && (
                  <span className="ml-1 text-xs text-gray-400">por defecto: {selectedSportType.defaultOpenTime}</span>
                )}
              </label>
              <input id="openTime" type="time" className="input" {...register('openTime')} />
            </div>
            <div>
              <label htmlFor="closeTime" className="label">
                Hora de cierre
                {selectedSportType && (
                  <span className="ml-1 text-xs text-gray-400">por defecto: {selectedSportType.defaultCloseTime}</span>
                )}
              </label>
              <input id="closeTime" type="time" className="input" {...register('closeTime')} />
            </div>
          </div>

          <div>
            <label className="label">
              Días habilitados
              {selectedSportType && (
                <span className="ml-1 text-xs text-gray-400">(vacío = hereda del tipo de deporte)</span>
              )}
            </label>
            <Controller
              name="enabledDays"
              control={control}
              render={({ field }) => (
                <div className="flex flex-wrap gap-2 mt-1">
                  {DAYS.map((day) => {
                    const checked = field.value?.includes(day.value);
                    return (
                      <label key={day.value} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
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
              onClick={() => navigate('/venues')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button type="submit" disabled={updateVenue.isPending} className="btn-primary">
              {updateVenue.isPending ? <Spinner size="sm" className="text-white" /> : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
