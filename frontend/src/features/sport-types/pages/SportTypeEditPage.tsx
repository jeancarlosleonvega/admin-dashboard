import { useNavigate, useParams } from 'react-router-dom';
import { usePageHeader } from '@/hooks/usePageHeader';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useSportType, useUpdateSportType } from '@/hooks/queries/useSportTypes';
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
  name: z.string().min(1, 'El nombre es requerido').max(100),
  description: z.string().max(500).optional(),
  defaultIntervalMinutes: z.coerce.number().int().min(5).max(120),
  defaultPlayersPerSlot: z.coerce.number().int().min(1).max(20),
  defaultOpenTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
  defaultCloseTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
  defaultEnabledDays: z.array(z.coerce.number().int().min(1).max(7)).min(1, 'Selecciona al menos un día'),
  active: z.boolean(),
});

type FormData = z.infer<typeof schema>;

export default function SportTypeEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  usePageHeader({ subtitle: 'Editar tipo de deporte' });
  const { data: sportType, isLoading, isError } = useSportType(id!);
  const updateSportType = useUpdateSportType();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
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
      navigate('/sport-types');
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
        <button onClick={() => navigate('/sport-types')} className="mt-4 text-blue-600 hover:underline">
          Volver a Tipos de Deporte
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => navigate('/sport-types')}
        className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Volver a Tipos de Deporte
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
            <textarea
              id="description"
              rows={3}
              className="input"
              {...register('description')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="defaultIntervalMinutes" className="label">Intervalo por defecto (min) *</label>
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
              <label htmlFor="defaultPlayersPerSlot" className="label">Jugadores por slot por defecto *</label>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="defaultOpenTime" className="label">Hora de apertura por defecto *</label>
              <input
                id="defaultOpenTime"
                type="time"
                className={`input ${errors.defaultOpenTime ? 'input-error' : ''}`}
                {...register('defaultOpenTime')}
              />
              {errors.defaultOpenTime && <p className="mt-1 text-sm text-red-600">{errors.defaultOpenTime.message}</p>}
            </div>
            <div>
              <label htmlFor="defaultCloseTime" className="label">Hora de cierre por defecto *</label>
              <input
                id="defaultCloseTime"
                type="time"
                className={`input ${errors.defaultCloseTime ? 'input-error' : ''}`}
                {...register('defaultCloseTime')}
              />
              {errors.defaultCloseTime && <p className="mt-1 text-sm text-red-600">{errors.defaultCloseTime.message}</p>}
            </div>
          </div>

          <div>
            <label className="label">Días habilitados por defecto *</label>
            <Controller
              name="defaultEnabledDays"
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
            {errors.defaultEnabledDays && <p className="mt-1 text-sm text-red-600">{errors.defaultEnabledDays.message}</p>}
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
              onClick={() => navigate('/sport-types')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button type="submit" disabled={updateSportType.isPending} className="btn-primary">
              {updateSportType.isPending ? <Spinner size="sm" className="text-white" /> : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
