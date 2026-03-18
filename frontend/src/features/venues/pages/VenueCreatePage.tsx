import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageHeader } from '@/hooks/usePageHeader';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useCreateVenue } from '@/hooks/queries/useVenues';
import { useSportTypes } from '@/hooks/queries/useSportTypes';
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

interface OperatingHoursBlock {
  daysOfWeek: number[];
  openTime: string;
  closeTime: string;
}

const schema = z.object({
  sportTypeId: z.string().uuid('Seleccioná un tipo de deporte'),
  name: z.string().min(1, 'El nombre es obligatorio').max(100),
  description: z.string().max(500).optional(),
  active: z.boolean(),
});

type FormData = z.infer<typeof schema>;

export default function VenueCreatePage() {
  const navigate = useNavigate();
  usePageHeader({ subtitle: 'Crear nuevo espacio' });
  const createVenue = useCreateVenue();
  const { data: sportTypesData } = useSportTypes({ active: 'true', limit: 100 });
  const [operatingHours, setOperatingHours] = useState<OperatingHoursBlock[]>([]);

  const sportTypes = sportTypesData?.data ?? [];

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      active: true,
    },
  });

  const addBlock = () => {
    setOperatingHours([...operatingHours, { daysOfWeek: [], openTime: '08:00', closeTime: '18:00' }]);
  };

  const removeBlock = (idx: number) => {
    setOperatingHours(operatingHours.filter((_, i) => i !== idx));
  };

  const updateBlock = (idx: number, partial: Partial<OperatingHoursBlock>) => {
    setOperatingHours(operatingHours.map((b, i) => (i === idx ? { ...b, ...partial } : b)));
  };

  const toggleDay = (idx: number, day: number) => {
    const block = operatingHours[idx];
    const current = block.daysOfWeek;
    const updated = current.includes(day) ? current.filter((d) => d !== day) : [...current, day].sort();
    updateBlock(idx, { daysOfWeek: updated });
  };

  const onSubmit = async (data: FormData) => {
    // Validar bloques de horario
    for (const block of operatingHours) {
      if (block.daysOfWeek.length === 0) {
        toast.error('Cada bloque de horario debe tener al menos un día seleccionado');
        return;
      }
    }

    try {
      await createVenue.mutateAsync({
        sportTypeId: data.sportTypeId,
        name: data.name,
        active: data.active,
        ...(data.description ? { description: data.description } : {}),
        ...(operatingHours.length > 0 ? { operatingHours } : {}),
      });
      toast.success('Espacio creado exitosamente');
      navigate('/espacios');
    } catch (error) {
      const message = (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Error al crear el espacio';
      toast.error(message);
    }
  };

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
                        onChange={(e) => field.onChange(e.target.value)}
                      >
                        <option value="">Seleccioná...</option>
                        {sportTypes.map((st) => (
                          <option key={st.id} value={st.id}>{st.name}</option>
                        ))}
                      </select>
                    )}
                  />
                  {errors.sportTypeId && <p className="mt-1 text-sm text-red-600">{errors.sportTypeId.message}</p>}
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

            <DetailSection title="Horarios operativos" description="Definí los bloques de horario para este espacio" noBorder>
              <div className="space-y-3">
                {operatingHours.length === 0 && (
                  <p className="text-sm text-gray-400 italic">Sin horarios definidos — se configurarán en los schedules.</p>
                )}

                {operatingHours.map((block, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-gray-700">Bloque {idx + 1}</span>
                      <button type="button" onClick={() => removeBlock(idx)} className="p-1 text-gray-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="label text-xs">Días</label>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {DAYS.map((day) => {
                            const selected = block.daysOfWeek.includes(day.value);
                            return (
                              <button
                                key={day.value}
                                type="button"
                                onClick={() => toggleDay(idx, day.value)}
                                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                                  selected ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'
                                }`}
                              >
                                {day.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="label text-xs">Apertura</label>
                          <input
                            type="time"
                            className="input"
                            value={block.openTime}
                            onChange={(e) => updateBlock(idx, { openTime: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="label text-xs">Cierre</label>
                          <input
                            type="time"
                            className="input"
                            value={block.closeTime}
                            onChange={(e) => updateBlock(idx, { closeTime: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addBlock}
                  className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Agregar bloque de horario
                </button>
              </div>
            </DetailSection>
          </div>

          <div className="px-6 pb-6 flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/espacios')}
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
