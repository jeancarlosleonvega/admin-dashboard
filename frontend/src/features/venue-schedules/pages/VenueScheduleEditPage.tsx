import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePageHeader } from '@/hooks/usePageHeader';
import { useVenueSchedule, useUpdateVenueSchedule } from '@/hooks/queries/useVenueSchedules';
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

export default function VenueScheduleEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  usePageHeader({ subtitle: 'Editar horario de apertura' });

  const { data: schedule, isLoading } = useVenueSchedule(id!);
  const updateSchedule = useUpdateVenueSchedule();

  const [form, setForm] = useState({
    name: '',
    startDate: '',
    endDate: '',
    daysOfWeek: [] as number[],
    openTime: '',
    closeTime: '',
    intervalMinutes: '',
    active: true,
  });

  useEffect(() => {
    if (schedule) {
      setForm({
        name: schedule.name,
        startDate: schedule.startDate.split('T')[0],
        endDate: schedule.endDate ? schedule.endDate.split('T')[0] : '',
        daysOfWeek: schedule.daysOfWeek,
        openTime: schedule.openTime ?? '',
        closeTime: schedule.closeTime ?? '',
        intervalMinutes: schedule.intervalMinutes?.toString() ?? '',
        active: schedule.active,
      });
    }
  }, [schedule]);

  const toggleDay = (day: number) => {
    setForm((f) => ({
      ...f,
      daysOfWeek: f.daysOfWeek.includes(day)
        ? f.daysOfWeek.filter((d) => d !== day)
        : [...f.daysOfWeek, day].sort(),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSchedule.mutateAsync({
        id: id!,
        data: {
          name: form.name,
          startDate: new Date(form.startDate).toISOString(),
          endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
          daysOfWeek: form.daysOfWeek,
          openTime: form.openTime || null,
          closeTime: form.closeTime || null,
          intervalMinutes: form.intervalMinutes ? parseInt(form.intervalMinutes) : null,
          active: form.active,
        },
      });
      toast.success('Schedule actualizado exitosamente');
      navigate('/venue-schedules');
    } catch (err: unknown) {
      toast.error(err?.response?.data?.error?.message ?? 'Error al actualizar schedule');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!schedule) {
    return <div className="text-red-500">Schedule no encontrado</div>;
  }

  return (
    <div className="max-w-2xl">
      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de inicio</label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de fin (opcional)</label>
            <input
              type="date"
              value={form.endDate}
              onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Días de la semana</label>
          <div className="flex gap-2 flex-wrap">
            {DAYS.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => toggleDay(d.value)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  form.daysOfWeek.includes(d.value)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Apertura</label>
            <input
              type="time"
              value={form.openTime}
              onChange={(e) => setForm((f) => ({ ...f, openTime: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cierre</label>
            <input
              type="time"
              value={form.closeTime}
              onChange={(e) => setForm((f) => ({ ...f, closeTime: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Intervalo (min)</label>
            <input
              type="number"
              value={form.intervalMinutes}
              onChange={(e) => setForm((f) => ({ ...f, intervalMinutes: e.target.value }))}
              min={5}
              max={240}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="active"
            checked={form.active}
            onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
            className="rounded border-gray-300 text-blue-600"
          />
          <label htmlFor="active" className="text-sm text-gray-700">Activo</label>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/venue-schedules')} className="btn-secondary">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={updateSchedule.isPending}
            className="btn-primary disabled:opacity-50 flex items-center gap-2"
          >
            {updateSchedule.isPending && <Spinner size="sm" />}
            Guardar cambios
          </button>
        </div>
      </form>
    </div>
  );
}
