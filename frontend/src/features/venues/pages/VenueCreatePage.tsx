import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageHeader } from '@/hooks/usePageHeader';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { useCreateVenue } from '@/hooks/queries/useVenues';
import { useSportTypes } from '@/hooks/queries/useSportTypes';
import { Spinner } from '@components/ui/Spinner';
import { DetailSection } from '@components/ui/DetailSection';
import type { SportType } from '@/types/sport-type.types';
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
  sportTypeId: z.string().uuid('Seleccioná un tipo de deporte'),
  name: z.string().min(1, 'El nombre es obligatorio').max(100),
  description: z.string().max(500).optional(),
  intervalMinutes: z.coerce.number().int().min(5).max(120).optional().or(z.literal('')),
  playersPerSlot: z.coerce.number().int().min(1).max(20).optional().or(z.literal('')),
  openTime: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal('')),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal('')),
  enabledDays: z.array(z.coerce.number().int().min(1).max(7)).optional(),
  active: z.boolean(),
});

type FormData = z.infer<typeof schema>;

export default function VenueCreatePage() {
  const navigate = useNavigate();
  usePageHeader({ subtitle: 'Crear nuevo espacio' });
  const createVenue = useCreateVenue();
  const { data: sportTypesData } = useSportTypes({ active: 'true', limit: 100 });
  const [selectedSportType, setSelectedSportType] = useState<SportType | null>(null);

  const sportTypes = sportTypesData?.data ?? [];

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      active: true,
      enabledDays: [],
    },
  });

  const handleSportTypeChange = (id: string) => {
    setValue('sportTypeId', id);
    const st = sportTypes.find((s) => s.id === id) ?? null;
    setSelectedSportType(st);
  };

  const onSubmit = async (data: FormData) => {
    try {
      await createVenue.mutateAsync({
        sportTypeId: data.sportTypeId,
        name: data.name,
        active: data.active,
        ...(data.description ? { description: data.description } : {}),
        ...(data.intervalMinutes ? { intervalMinutes: Number(data.intervalMinutes) } : {}),
        ...(data.playersPerSlot ? { playersPerSlot: Number(data.playersPerSlot) } : {}),
        ...(data.openTime && data.openTime !== '' ? { openTime: data.openTime } : {}),
        ...(data.closeTime && data.closeTime !== '' ? { closeTime: data.closeTime } : {}),
        ...(data.enabledDays && data.enabledDays.length > 0 ? { enabledDays: data.enabledDays } : {}),
      });
      toast.success('Espacio creado exitosamente');
      navigate('/venues');
    } catch (error) {
      const message = (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Error al crear el espacio';
      toast.error(message);
    }
  };

  return (
    <div>
      <button
        onClick={() => navigate('/venues')}
        className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Volver a Espacios
      </button>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="px-6">
            <DetailSection title="Información" description="Datos principales del espacio">
              <div className="space-y-4">
                <div>
                  <label htmlFor="sportTypeId" className="label">Tipo de deporte</label>
                  <Controller
                    name="sportTypeId"
                    control={control}
                    render={({ field }) => (
                      <select
                        id="sportTypeId"
                        className={`input ${errors.sportTypeId ? 'input-error' : ''}`}
                        value={field.value ?? ''}
                        onChange={(e) => {
                          field.onChange(e.target.value);
                          handleSportTypeChange(e.target.value);
                        }}
                      >
                        <option value="">Seleccioná...</option>
                        {sportTypes.map((st) => (
                          <option key={st.id} value={st.id}>{st.name}</option>
                        ))}
                      </select>
                    )}
                  />
                  {errors.sportTypeId && <p className="mt-1 text-sm text-red-600">{errors.sportTypeId.message}</p>}
                  {selectedSportType && (
                    <p className="mt-1 text-xs text-blue-600">Los campos vacíos usarán los valores del tipo de deporte seleccionado</p>
                  )}
                </div>
                <div>
                  <label htmlFor="name" className="label">Nombre</label>
                  <input
                    id="name"
                    type="text"
                    className={`input ${errors.name ? 'input-error' : ''}`}
                    placeholder="Ej: Cancha 1, Pista A"
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
                    placeholder="Descripción del espacio"
                    {...register('description')}
                  />
                </div>
              </div>
            </DetailSection>

            <DetailSection title="Configuración (opcional)" description="Sobreescribí los valores heredados del tipo de deporte" noBorder>
              <div className="space-y-4">
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
                      placeholder={selectedSportType ? String(selectedSportType.defaultIntervalMinutes) : ''}
                      className="input"
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
                      placeholder={selectedSportType ? String(selectedSportType.defaultPlayersPerSlot) : ''}
                      className="input"
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
                      {...register('closeTime')}
                    />
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
              </div>
            </DetailSection>
          </div>

          <div className="px-6 pb-6 flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/venues')}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button type="submit" disabled={createVenue.isPending} className="btn-primary">
              {createVenue.isPending ? <Spinner size="sm" className="text-white" /> : 'Crear espacio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
