import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePageHeader } from '@/hooks/usePageHeader';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { useVenueSchedule, useUpdateVenueSchedule } from '@/hooks/queries/useVenueSchedules';
import { Spinner } from '@components/ui/Spinner';
import { DetailSection } from '@components/ui/DetailSection';
import ScheduleRulesEditor from '../components/ScheduleRulesEditor';
import type { RuleFormValue } from '../components/ScheduleRulesEditor';
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
  name: z.string().min(1, 'El nombre es obligatorio'),
  startDate: z.string().min(1, 'La fecha de inicio es obligatoria'),
  endDate: z.string().optional(),
  daysOfWeek: z.array(z.number().int().min(1).max(7)).min(1, 'Seleccioná al menos un día'),
  openTime: z.string().optional(),
  closeTime: z.string().optional(),
  intervalMinutes: z.union([z.literal(''), z.null(), z.undefined(), z.coerce.number().int().min(5, 'Mínimo 5 min').max(240, 'Máximo 240 min')]).transform((v) => (v === '' || v == null ? null : Number(v))).optional(),
  playersPerSlot: z.union([z.literal(''), z.null(), z.undefined(), z.coerce.number().int().min(1, 'Mínimo 1').max(100, 'Máximo 100')]).transform((v) => (v === '' || v == null ? null : Number(v))).optional(),
  active: z.boolean(),
});

type FormData = z.infer<typeof schema>;

export default function VenueScheduleEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  usePageHeader({ subtitle: 'Editar horario de apertura' });

  const { data: schedule, isLoading, isError } = useVenueSchedule(id!);
  const updateSchedule = useUpdateVenueSchedule();

  const [rules, setRules] = useState<RuleFormValue[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      daysOfWeek: [],
      active: true,
    },
  });

  useEffect(() => {
    if (schedule) {
      reset({
        name: schedule.name,
        startDate: schedule.startDate.split('T')[0],
        endDate: schedule.endDate ? schedule.endDate.split('T')[0] : '',
        daysOfWeek: schedule.daysOfWeek,
        openTime: schedule.openTime ?? '',
        closeTime: schedule.closeTime ?? '',
        intervalMinutes: schedule.intervalMinutes ?? null,
        playersPerSlot: schedule.playersPerSlot ?? null,
        active: schedule.active,
      });

      // Cargar rules existentes
      if (schedule.rules && schedule.rules.length > 0) {
        setRules(schedule.rules.map((r) => ({
          canBook: r.canBook,
          basePrice: typeof r.basePrice === 'number' ? r.basePrice : parseFloat(String(r.basePrice)),
          revenueManagementEnabled: r.revenueManagementEnabled,
          conditions: r.conditions.map((c) => ({
            conditionTypeId: c.conditionTypeId,
            operator: c.operator,
            value: c.value,
            logicalOperator: c.logicalOperator ?? '',
            order: c.order,
          })),
        })));
      } else {
        setRules([]);
      }
    }
  }, [schedule, reset]);

  const onSubmit = async (data: FormData) => {
    if (!id) return;

    // Validar reglas: todas las condiciones deben tener conditionTypeId y value
    for (const rule of rules) {
      for (const cond of rule.conditions) {
        if (!cond.conditionTypeId || !cond.value) {
          toast.error('Completá todas las condiciones de las reglas antes de guardar');
          return;
        }
      }
    }

    try {
      await updateSchedule.mutateAsync({
        id,
        data: {
          name: data.name,
          startDate: new Date(data.startDate).toISOString(),
          endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
          daysOfWeek: data.daysOfWeek,
          openTime: data.openTime || null,
          closeTime: data.closeTime || null,
          intervalMinutes: data.intervalMinutes || null,
          playersPerSlot: data.playersPerSlot || null,
          active: data.active,
          rules: rules.map((r) => ({
            canBook: r.canBook,
            basePrice: r.basePrice,
            revenueManagementEnabled: r.revenueManagementEnabled,
            conditions: r.conditions.map((c, i) => ({
              conditionTypeId: c.conditionTypeId,
              operator: c.operator as 'EQ' | 'NEQ' | 'GT' | 'GTE' | 'LT' | 'LTE',
              value: c.value,
              logicalOperator: i === 0 ? null : (c.logicalOperator as 'AND' | 'OR') || 'AND',
              order: i,
            })),
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
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
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
                    className="input"
                    {...register('intervalMinutes')}
                  />
                </div>
                <div>
                  <label htmlFor="playersPerSlot" className="label">Jugadores por turno <span className="text-gray-400 font-normal">(opcional)</span></label>
                  <input
                    id="playersPerSlot"
                    type="number"
                    min={1}
                    max={100}
                    placeholder="Ej: 4"
                    className="input"
                    {...register('playersPerSlot')}
                  />
                </div>
              </div>
            </DetailSection>

            <DetailSection title="Días de la semana" description="Días en que aplica este horario">
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

            <DetailSection title="Reglas de acceso" description="Definí quién puede reservar en este horario y a qué precio" noBorder>
              <ScheduleRulesEditor rules={rules} onChange={setRules} />
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
