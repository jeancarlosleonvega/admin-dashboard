import { useNavigate } from 'react-router-dom';
import { usePageHeader } from '@/hooks/usePageHeader';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { blockedPeriodsApi } from '@api/blockedPeriods.api';
import { useSportTypes } from '@/hooks/queries/useSportTypes';
import { useVenues } from '@/hooks/queries/useVenues';
import { Spinner } from '@components/ui/Spinner';
import { DetailSection } from '@components/ui/DetailSection';
import toast from 'react-hot-toast';

const schema = z.object({
  sportTypeId: z.string().uuid().optional().nullable(),
  venueId: z.string().uuid().optional().nullable(),
  startDate: z.string().min(1, 'La fecha de inicio es obligatoria'),
  endDate: z.string().min(1, 'La fecha de fin es obligatoria'),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  reason: z.string().optional(),
  active: z.boolean(),
});

type FormData = z.infer<typeof schema>;

export default function BlockedPeriodCreatePage() {
  const navigate = useNavigate();
  usePageHeader({ subtitle: 'Crear nuevo período bloqueado' });
  const queryClient = useQueryClient();

  const { data: sportTypesData } = useSportTypes({ active: 'true', limit: 100 });
  const { data: venuesData } = useVenues({ active: 'true', limit: 100 });

  const sportTypes = sportTypesData?.data ?? [];
  const venues = venuesData?.data ?? [];

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      sportTypeId: null,
      venueId: null,
      active: true,
    },
  });

  const selectedSportTypeId = watch('sportTypeId');
  const filteredVenues = selectedSportTypeId
    ? venues.filter((v) => v.sportTypeId === selectedSportTypeId)
    : venues;

  const createMutation = useMutation({
    mutationFn: (data: FormData) =>
      blockedPeriodsApi.createBlockedPeriod({
        sportTypeId: data.sportTypeId || null,
        venueId: data.venueId || null,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
        startTime: data.startTime || null,
        endTime: data.endTime || null,
        reason: data.reason || undefined,
        active: data.active,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-periods'] });
      toast.success('Período bloqueado creado exitosamente');
      navigate('/blocked-periods');
    },
    onError: (error: { response?: { data?: { error?: { message?: string } } } }) => {
      const message = error.response?.data?.error?.message || 'Error al crear el período bloqueado';
      toast.error(message);
    },
  });

  const onSubmit = (data: FormData) => {
    createMutation.mutate(data);
  };

  return (
    <div>
      <button
        onClick={() => navigate('/blocked-periods')}
        className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Volver a Períodos Bloqueados
      </button>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="px-6">
            <DetailSection title="Aplicar a" description="A quién se aplica este bloqueo">
              <div className="space-y-4">
                <div>
                  <label htmlFor="sportTypeId" className="label">Tipo de deporte <span className="text-gray-400 font-normal">(opcional)</span></label>
                  <select id="sportTypeId" className="input" {...register('sportTypeId')}>
                    <option value="">Todos los deportes</option>
                    {sportTypes.map((st) => (
                      <option key={st.id} value={st.id}>{st.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="venueId" className="label">Espacio <span className="text-gray-400 font-normal">(opcional)</span></label>
                  <select id="venueId" className="input" {...register('venueId')}>
                    <option value="">Todos los espacios</option>
                    {filteredVenues.map((v) => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </DetailSection>

            <DetailSection title="Período" description="Rango de fechas del bloqueo">
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
                  <label htmlFor="endDate" className="label">Fecha de fin</label>
                  <input
                    id="endDate"
                    type="date"
                    className={`input ${errors.endDate ? 'input-error' : ''}`}
                    {...register('endDate')}
                  />
                  {errors.endDate && <p className="mt-1 text-sm text-red-600">{errors.endDate.message}</p>}
                </div>
              </div>
            </DetailSection>

            <DetailSection title="Franja horaria (opcional)" description="Si no especificás hora, se bloquea el día completo">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startTime" className="label">Hora de inicio <span className="text-gray-400 font-normal">(opcional)</span></label>
                  <input
                    id="startTime"
                    type="time"
                    className="input"
                    {...register('startTime')}
                  />
                </div>
                <div>
                  <label htmlFor="endTime" className="label">Hora de fin <span className="text-gray-400 font-normal">(opcional)</span></label>
                  <input
                    id="endTime"
                    type="time"
                    className="input"
                    {...register('endTime')}
                  />
                </div>
              </div>
            </DetailSection>

            <DetailSection title="Detalles" description="Información adicional del bloqueo" noBorder>
              <div className="space-y-4">
                <div>
                  <label htmlFor="reason" className="label">Razón <span className="text-gray-400 font-normal">(opcional)</span></label>
                  <textarea
                    id="reason"
                    rows={3}
                    className="input"
                    placeholder="Ej: Mantenimiento, Feriado nacional..."
                    {...register('reason')}
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
              onClick={() => navigate('/blocked-periods')}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button type="submit" disabled={createMutation.isPending} className="btn-primary">
              {createMutation.isPending ? <Spinner size="sm" className="text-white" /> : 'Crear período bloqueado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
