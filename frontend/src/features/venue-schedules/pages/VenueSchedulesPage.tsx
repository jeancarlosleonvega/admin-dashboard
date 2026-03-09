import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageHeader } from '@/hooks/usePageHeader';
import { Plus, Clock, Pencil, Trash2 } from 'lucide-react';
import { useVenueSchedules, useDeleteVenueSchedule, useGenerateSlots } from '@/hooks/queries/useVenueSchedules';
import { Spinner } from '@components/ui/Spinner';
import ConfirmDialog from '@components/shared/ConfirmDialog';
import toast from 'react-hot-toast';
import type { VenueSchedule } from '@/types/venue-schedule.types';

const DAY_NAMES: Record<number, string> = {
  1: 'L', 2: 'M', 3: 'X', 4: 'J', 5: 'V', 6: 'S', 7: 'D',
};

export default function VenueSchedulesPage() {
  const navigate = useNavigate();
  const [venueIdFilter] = useState<string | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<VenueSchedule | null>(null);
  const [generateTarget, setGenerateTarget] = useState<VenueSchedule | null>(null);
  const [generateUntil, setGenerateUntil] = useState('');

  const headerActions = useMemo(() => (
    <button className="btn-primary" onClick={() => navigate('/venue-schedules/create')}>
      <Plus className="w-4 h-4 mr-2" />
      Crear Schedule
    </button>
  ), [navigate]);

  usePageHeader({ subtitle: 'Gestionar horarios de apertura de espacios', actions: headerActions });

  const { data, isLoading, isError } = useVenueSchedules({ venueId: venueIdFilter });
  const deleteSchedule = useDeleteVenueSchedule();
  const generateSlots = useGenerateSlots();

  const schedules = data?.data ?? [];

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteSchedule.mutateAsync(deleteTarget.id);
      toast.success('Schedule eliminado');
      setDeleteTarget(null);
    } catch {
      toast.error('Error al eliminar schedule');
    }
  };

  const handleGenerateSlots = async () => {
    if (!generateTarget || !generateUntil) return;
    try {
      await generateSlots.mutateAsync({ id: generateTarget.id, until: new Date(generateUntil).toISOString() });
      toast.success('Slots generados correctamente');
      setGenerateTarget(null);
      setGenerateUntil('');
    } catch {
      toast.error('Error al generar slots');
    }
  };

  return (
    <div>
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : isError ? (
          <div className="px-6 py-12 text-center text-red-500">
            <p>No se pudieron cargar los schedules.</p>
          </div>
        ) : schedules.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No hay schedules creados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Venue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Días</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Horario</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Intervalo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Generado hasta</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {schedules.map((schedule) => (
                  <tr key={schedule.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{schedule.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{schedule.venue?.name ?? '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                          <span
                            key={d}
                            className={`inline-flex items-center justify-center w-6 h-6 text-xs font-medium rounded-full ${
                              schedule.daysOfWeek.includes(d)
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-400'
                            }`}
                          >
                            {DAY_NAMES[d]}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {schedule.openTime && schedule.closeTime
                        ? `${schedule.openTime} - ${schedule.closeTime}`
                        : 'Por defecto'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {schedule.intervalMinutes ? `${schedule.intervalMinutes} min` : 'Por defecto'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {schedule.generatedUntil
                        ? new Date(schedule.generatedUntil).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          schedule.active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {schedule.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => { setGenerateTarget(schedule); setGenerateUntil(''); }}
                          className="px-2 py-1 text-xs text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                          title="Generar más slots"
                        >
                          Generar slots
                        </button>
                        <button
                          onClick={() => navigate(`/venue-schedules/${schedule.id}/edit`)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(schedule)}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Eliminar Schedule"
        message={`¿Estás seguro de eliminar el schedule "${deleteTarget?.name}"? Los slots futuros serán eliminados.`}
        confirmLabel="Eliminar"
        variant="danger"
        isLoading={deleteSchedule.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {generateTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Generar slots para "{generateTarget.name}"</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Generar hasta</label>
              <input
                type="date"
                value={generateUntil}
                onChange={(e) => setGenerateUntil(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setGenerateTarget(null); setGenerateUntil(''); }}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleGenerateSlots}
                disabled={!generateUntil || generateSlots.isPending}
                className="btn-primary disabled:opacity-50"
              >
                {generateSlots.isPending ? 'Generando...' : 'Generar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
