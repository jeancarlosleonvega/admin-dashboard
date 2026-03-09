import { useNavigate } from 'react-router-dom';
import { usePageHeader } from '@/hooks/usePageHeader';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { useCreateVenueSchedule } from '@/hooks/queries/useVenueSchedules';
import { useVenues } from '@/hooks/queries/useVenues';
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
  venueId: z.string().uuid('Seleccioná un espacio'),
  name: z.string().min(1, 'El nombre es obligatorio'),
  startDate: z.string().min(1, 'La fecha de inicio es obligatoria'),
  endDate: z.string().optional(),
  daysOfWeek: z.array(z.number().int().min(1).max(7)).min(1, 'Seleccioná al menos un día'),
  openTime: z.string().optional(),
  closeTime: z.string().optional(),
  intervalMinutes: z.coerce.number().int().min(5).max(240).optional().nullable(),
  active: z.boolean(),
});

type FormData = z.infer<typeof schema>;

export default function VenueScheduleCreatePage() {
  const navigate = useNavigate();
  usePageHeader({ subtitle: 'Crear nuevo horario de apertura' });

  const createSchedule = useCreateVenueSchedule();
  const { data: venuesData, isLoading: venuesLoading } = useVenues({ active: 'true', limit: 100 });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      daysOfWeek: [],
      active: true,
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await createSchedule.mutateAsync({
        venueId: data.venueId,
        name: data.name,
        startDate: new Date(data.startDate).toISOString(),
        endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
        daysOfWeek: data.daysOfWeek,
        openTime: data.openTime || null,
        closeTime: data.closeTime || null,
        intervalMinutes: data.intervalMinutes || null,
        active: data.active,
      });
      toast.success('Horario creado exitosamente');
      navigate('/venue-schedules');
    } catch (error) {
      const message = (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Error al crear el horario';
      toast.error(message);
    }
  };

  return (
    <div>
      <button
        onClick={() => navigate('/venue-schedules')}
        className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Volver a Horarios
      </button>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="px-6">
            <DetailSection title="Información" description="Espacio y nombre del horario">
              <div className="space-y-4">
                <div>
                  <label htmlFor="venueId" className="label">Espacio</label>
                  {venuesLoading ? (
                    <Spinner size="sm" />
                  ) : (
                    <select
                      id="venueId"
                      className={`input ${errors.venueId ? 'input-error' : ''}`}
                      {...register('venueId')}
                    >
                      <option value="">Seleccioná...</option>
                      {(venuesData?.data ?? []).map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} ({v.sportType.name})
                        </option>
                      ))}
                    </select>
                  )}
                  {errors.venueId && <p className="mt-1 text-sm text-red-600">{errors.venueId.message}</p>}
                </div>
                <div>
                  <label htmlFor="name" className="label">Nombre del horario</label>
                  <input
                    id="name"
                    type="text"
                    className={`input ${errors.name ? 'input-error' : ''}`}
                    placeholder="Ej: Horario de verano"
                    {...register('name')}
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
                </div>
              </div>
            </DetailSection>

            <DetailSection title="Vigencia" description="Período de validez del horario">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startDate" className="label">Fecha de inicio</label>
                  <input
                    id="startDate"
                    type="date"
                    className={`input ${errors.startDate ? 'input-error' : ''}`}
                    {...register('startDate')}
                  />
                  {errors.startDate && <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>}
                </div>
                <div>
                  <label htmlFor="endDate" className="label">Fecha de fin <span className="text-gray-400 font-normal">(opcional)</span></label>
                  <input
                    id="endDate"
                    type="date"
                    className="input"
                    {...register('endDate')}
                  />
                  <p className="mt-1 text-xs text-gray-500">Dejá vacío para sin fecha de fin</p>
                </div>
              </div>
            </DetailSection>

            <DetailSection title="Configuración (opcional)" description="Sobreescribí los valores del espacio para este horario">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="openTime" className="label">Hora de apertura <span className="text-gray-400 font-normal">(opcional)</span></label>
                  <input
                    id="openTime"
                    type="time"
                    className="input"
                    {...register('openTime')}
                  />
                </div>
                <div>
                  <label htmlFor="closeTime" className="label">Hora de cierre <span className="text-gray-400 font-normal">(opcional)</span></label>
                  <input
                    id="closeTime"
                    type="time"
                    className="input"
                    {...register('closeTime')}
                  />
                </div>
                <div>
                  <label htmlFor="intervalMinutes" className="label">Intervalo (min) <span className="text-gray-400 font-normal">(opcional)</span></label>
                  <input
                    id="intervalMinutes"
                    type="number"
                    min={5}
                    max={240}
                    placeholder="Ej: 10"
                    className="input"
                    {...register('intervalMinutes')}
                  />
                </div>
              </div>
            </DetailSection>

            <DetailSection title="Días de la semana" description="Seleccioná los días en que aplica este horario" noBorder>
              <div>
                <Controller
                  name="daysOfWeek"
                  control={control}
                  render={({ field }) => (
                    <div className="flex flex-wrap gap-2">
                      {DAYS.map((day) => {
                        const selected = field.value?.includes(day.value);
                        return (
                          <button
                            key={day.value}
                            type="button"
                            onClick={() => {
                              const current = field.value ?? [];
                              if (selected) {
                                field.onChange(current.filter((d) => d !== day.value));
                              } else {
                                field.onChange([...current, day.value].sort());
                              }
                            }}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              selected
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {day.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                />
                {errors.daysOfWeek && <p className="mt-1 text-sm text-red-600">{errors.daysOfWeek.message}</p>}
                <div className="mt-4">
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
              onClick={() => navigate('/venue-schedules')}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button type="submit" disabled={createSchedule.isPending} className="btn-primary">
              {createSchedule.isPending ? <Spinner size="sm" className="text-white" /> : 'Crear horario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
