import { useNavigate } from 'react-router-dom';
import { usePageHeader } from '@/hooks/usePageHeader';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { useCreateSportType } from '@/hooks/queries/useSportTypes';
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
  defaultIntervalMinutes: z.coerce.number().int().min(5, 'Mínimo 5 minutos').max(120, 'Máximo 120 minutos'),
  defaultPlayersPerSlot: z.coerce.number().int().min(1, 'Mínimo 1 jugador').max(20, 'Máximo 20 jugadores'),
  defaultMemberPrice: z.coerce.number().min(0, 'El precio debe ser mayor o igual a 0'),
  defaultNonMemberPrice: z.coerce.number().min(0, 'El precio debe ser mayor o igual a 0'),
  defaultOpenTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM requerido'),
  defaultCloseTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM requerido'),
  defaultEnabledDays: z.array(z.coerce.number().int().min(1).max(7)).min(1, 'Seleccioná al menos un día'),
  active: z.boolean(),
});

type FormData = z.infer<typeof schema>;

export default function SportTypeCreatePage() {
  const navigate = useNavigate();
  usePageHeader({ subtitle: 'Crear nuevo tipo de deporte' });
  const createSportType = useCreateSportType();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      defaultIntervalMinutes: 10,
      defaultPlayersPerSlot: 4,
      defaultMemberPrice: 0,
      defaultNonMemberPrice: 0,
      defaultOpenTime: '08:00',
      defaultCloseTime: '18:00',
      defaultEnabledDays: [1, 2, 3, 4, 5, 6, 7],
      active: true,
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await createSportType.mutateAsync(data);
      toast.success('Tipo de deporte creado exitosamente');
      navigate('/tipos-deporte');
    } catch (error) {
      const message = (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Error al crear el tipo de deporte';
      toast.error(message);
    }
  };

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
                    placeholder="Ej: Pádel, Tenis, Fútbol"
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
                    placeholder="Descripción del tipo de deporte"
                    {...register('description')}
                  />
                </div>
              </div>
            </DetailSection>

            <DetailSection title="Configuración por defecto" description="Valores que se heredarán en los espacios de este tipo">
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
                    {...register('defaultCloseTime')}
                  />
                  {errors.defaultCloseTime && <p className="mt-1 text-sm text-red-600">{errors.defaultCloseTime.message}</p>}
                </div>
              </div>
            </DetailSection>

            <DetailSection title="Días habilitados por defecto" description="Días de la semana en que este tipo de deporte opera" noBorder>
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
                {errors.defaultEnabledDays && <p className="mt-1 text-sm text-red-600">{errors.defaultEnabledDays.message}</p>}
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
              onClick={() => navigate('/tipos-deporte')}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button type="submit" disabled={createSportType.isPending} className="btn-primary">
              {createSportType.isPending ? <Spinner size="sm" className="text-white" /> : 'Crear tipo de deporte'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
