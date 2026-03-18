import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePageHeader } from '@/hooks/usePageHeader';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { useVenueSchedule, useUpdateVenueSchedule } from '@/hooks/queries/useVenueSchedules';
import { Spinner } from '@components/ui/Spinner';
import { DetailSection } from '@components/ui/DetailSection';
import TimeRangesEditor from '../components/TimeRangesEditor';
import type { TimeRangeFormValue } from '../components/TimeRangesEditor';
import toast from 'react-hot-toast';

const schema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  active: z.boolean(),
});

type FormData = z.infer<typeof schema>;

export default function VenueScheduleEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  usePageHeader({ subtitle: 'Editar horario de apertura' });

  const { data: schedule, isLoading, isError } = useVenueSchedule(id!);
  const updateSchedule = useUpdateVenueSchedule();

  const [timeRanges, setTimeRanges] = useState<TimeRangeFormValue[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      active: true,
    },
  });

  useEffect(() => {
    if (schedule) {
      reset({
        name: schedule.name,
        startDate: schedule.startDate ? schedule.startDate.split('T')[0] : '',
        endDate: schedule.endDate ? schedule.endDate.split('T')[0] : '',
        active: schedule.active,
      });

      // Cargar timeRanges existentes
      if (schedule.timeRanges && schedule.timeRanges.length > 0) {
        setTimeRanges(schedule.timeRanges.map((tr) => ({
          daysOfWeek: tr.daysOfWeek,
          startTime: tr.startTime,
          endTime: tr.endTime,
          intervalMinutes: tr.intervalMinutes,
          playersPerSlot: tr.playersPerSlot,
          active: tr.active,
          rules: (tr.rules ?? []).map((r) => ({
            canBook: r.canBook,
            priceOverride: r.priceOverride != null ? parseFloat(String(r.priceOverride)) : null,
            revenueManagementEnabled: r.revenueManagementEnabled,
            conditions: r.conditions.map((c) => ({
              conditionTypeId: c.conditionTypeId,
              operator: c.operator,
              value: c.value,
              logicalOperator: c.logicalOperator ?? '',
              order: c.order,
            })),
          })),
        })));
      } else {
        setTimeRanges([]);
      }
    }
  }, [schedule, reset]);

  const onSubmit = async (data: FormData) => {
    if (!id) return;

    if (timeRanges.length === 0) {
      toast.error('Agregá al menos un bloque de tiempo al horario');
      return;
    }

    for (const tr of timeRanges) {
      if (tr.daysOfWeek.length === 0) {
        toast.error('Cada bloque de tiempo debe tener al menos un día seleccionado');
        return;
      }
      for (const rule of tr.rules) {
        for (const cond of rule.conditions) {
          if (!cond.conditionTypeId || !cond.value) {
            toast.error('Completá todas las condiciones de las reglas antes de guardar');
            return;
          }
        }
      }
    }

    try {
      await updateSchedule.mutateAsync({
        id,
        data: {
          name: data.name,
          startDate: data.startDate ? new Date(data.startDate).toISOString() : null,
          endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
          active: data.active,
          timeRanges: timeRanges.map((tr) => ({
            daysOfWeek: tr.daysOfWeek,
            startTime: tr.startTime,
            endTime: tr.endTime,
            intervalMinutes: tr.intervalMinutes,
            playersPerSlot: tr.playersPerSlot,
            active: tr.active,
            rules: tr.rules.length > 0 ? tr.rules.map((r) => ({
              canBook: r.canBook,
              priceOverride: r.priceOverride,
              revenueManagementEnabled: r.revenueManagementEnabled,
              conditions: r.conditions.map((c, i) => ({
                conditionTypeId: c.conditionTypeId,
                operator: c.operator as 'EQ' | 'NEQ' | 'GT' | 'GTE' | 'LT' | 'LTE',
                value: c.value,
                logicalOperator: i === 0 ? null : (c.logicalOperator as 'AND' | 'OR') || 'AND',
                order: i,
              })),
            })) : undefined,
          })),
        },
      });
      toast.success('Horario actualizado exitosamente');
      navigate('/horarios');
    } catch (error) {
      const message = (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Error al actualizar el horario';
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

  if (isError || !schedule) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Horario no encontrado</p>
        <button onClick={() => navigate('/horarios')} className="mt-4 text-blue-600 hover:underline">
          Volver a Horarios
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => navigate('/horarios')}
        className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Volver a Horarios
      </button>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="px-6">
            <DetailSection title="Información" description="Nombre del horario">
              <div>
                <label htmlFor="name" className="label">Nombre del horario</label>
                <input
                  id="name"
                  type="text"
                  className={`input ${errors.name ? 'input-error' : ''}`}
                  {...register('name')}
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
              </div>
            </DetailSection>

            <DetailSection title="Vigencia" description="Período de validez del horario">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startDate" className="label">Fecha de inicio <span className="text-gray-400 font-normal">(opcional)</span></label>
                  <input
                    id="startDate"
                    type="date"
                    className="input"
                    {...register('startDate')}
                  />
                  <p className="mt-1 text-xs text-gray-500">Dejá vacío para que aplique desde hoy</p>
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
            </DetailSection>

            <DetailSection title="Bloques de tiempo" description="Configurá los días, horarios y reglas de acceso para este horario" noBorder>
              <TimeRangesEditor timeRanges={timeRanges} onChange={setTimeRanges} />
            </DetailSection>
          </div>

          <div className="px-6 pb-6 flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/horarios')}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button type="submit" disabled={updateSchedule.isPending} className="btn-primary">
              {updateSchedule.isPending ? <Spinner size="sm" className="text-white" /> : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
