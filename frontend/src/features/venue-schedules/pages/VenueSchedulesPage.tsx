import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageHeader } from '@/hooks/usePageHeader';
import { Plus, Clock, Pencil, Trash2, RefreshCw, CalendarDays } from 'lucide-react';
import { useVenueSchedules, useDeleteVenueSchedule, useGenerateSlots } from '@/hooks/queries/useVenueSchedules';
import { useVenues } from '@/hooks/queries/useVenues';
import PermissionGate from '@components/shared/PermissionGate';
import ConfirmDialog from '@components/shared/ConfirmDialog';
import { Spinner } from '@components/ui/Spinner';
import DataToolbar from '@components/shared/DataToolbar';
import { useColumnVisibility } from '@/hooks/useColumnVisibility';
import type { ColumnDef } from '@/hooks/useColumnVisibility';
import type { VenueSchedule } from '@/types/venue-schedule.types';
import StatusBadge from '@components/shared/StatusBadge';
import toast from 'react-hot-toast';
import { formatDate } from '@lib/formatDate';

const columns: ColumnDef[] = [
  { key: 'name', label: 'Nombre', sortable: false, filterable: true, type: 'text' },
  { key: 'venue', label: 'Espacio', sortable: false, filterable: false },
  { key: 'timeRanges', label: 'Bloques', sortable: false, filterable: false },
  { key: 'generated', label: 'Generado hasta', sortable: false, filterable: false },
  {
    key: 'status', label: 'Estado', sortable: false, filterable: true, type: 'select', options: [
      { label: 'Activo', value: 'true' },
      { label: 'Inactivo', value: 'false' },
    ]
  },
  { key: 'actions', label: 'Acciones', sortable: false, filterable: false },
];

export default function VenueSchedulesPage() {
  const navigate = useNavigate();

  const headerActions = useMemo(() => (
    <PermissionGate permission="venue-schedules.manage">
      <button className="btn-primary" onClick={() => navigate('/horarios/create')}>
        <Plus className="w-4 h-4 mr-2" />
        Crear Horario
      </button>
    </PermissionGate>
  ), [navigate]);
  usePageHeader({ subtitle: 'Gestionar horarios de apertura de espacios', actions: headerActions });

  const [venueIdFilter, setVenueIdFilter] = useState<string>('');
  const [deleteTarget, setDeleteTarget] = useState<VenueSchedule | null>(null);
  const [generateTarget, setGenerateTarget] = useState<VenueSchedule | null>(null);
  const [generateUntil, setGenerateUntil] = useState('');

  const { visibleColumns, toggleColumn, resetColumns } = useColumnVisibility('venue-schedules-columns', columns);

  const { data, isLoading, isError } = useVenueSchedules({ venueId: venueIdFilter || undefined });
  const { data: venuesData } = useVenues({ active: 'true', limit: 100 });
  const deleteSchedule = useDeleteVenueSchedule();
  const generateSlots = useGenerateSlots();

  const schedules = data?.data ?? [];
  const venues = venuesData?.data ?? [];

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteSchedule.mutateAsync(deleteTarget.id);
      toast.success('Horario eliminado exitosamente');
      setDeleteTarget(null);
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message ?? 'Error al eliminar el horario';
      toast.error(msg);
    }
  };

  const handleGenerateSlots = async () => {
    if (!generateTarget || !generateUntil) return;
    try {
      await generateSlots.mutateAsync({ id: generateTarget.id, until: new Date(generateUntil).toISOString() });
      toast.success('Turnos generados correctamente');
      setGenerateTarget(null);
      setGenerateUntil('');
    } catch {
      toast.error('Error al generar turnos');
    }
  };

  return (
    <div>
      <DataToolbar
        columns={columns}
        onSearchChange={useCallback(() => {}, [])}
        onSortChange={useCallback(() => {}, [])}
        onFiltersChange={useCallback(() => {}, [])}
        visibleColumns={visibleColumns}
        onToggleColumn={toggleColumn}
        onResetColumns={resetColumns}
        quickFilters={[
          {
            key: 'venueId',
            label: 'Espacio',
            value: venueIdFilter,
            onChange: setVenueIdFilter,
            options: venues.map((v) => ({ label: v.name, value: v.id })),
          },
        ]}
      />

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : isError ? (
          <div className="px-6 py-12 text-center text-red-500">
            <p>No se pudieron cargar los horarios. Por favor, inténtalo de nuevo.</p>
          </div>
        ) : schedules.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No hay horarios configurados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {visibleColumns.includes('name') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                  )}
                  {visibleColumns.includes('venue') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Espacio</th>
                  )}
                  {visibleColumns.includes('timeRanges') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bloques</th>
                  )}
                  {visibleColumns.includes('generated') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Generado hasta</th>
                  )}
                  {visibleColumns.includes('status') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  )}
                  {visibleColumns.includes('actions') && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {schedules.map((schedule) => (
                  <tr key={schedule.id} className="hover:bg-gray-50">
                    {visibleColumns.includes('name') && (
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{schedule.name}</td>
                    )}
                    {visibleColumns.includes('venue') && (
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {schedule.venue
                          ? <><span className="font-medium text-gray-700">{schedule.venue.sportType.name}</span>: {schedule.venue.name}</>
                          : '-'}
                      </td>
                    )}
                    {visibleColumns.includes('timeRanges') && (
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {schedule.timeRanges && schedule.timeRanges.length > 0
                          ? `${schedule.timeRanges.length} bloque${schedule.timeRanges.length !== 1 ? 's' : ''}`
                          : <span className="text-gray-400">Sin bloques</span>}
                      </td>
                    )}
                    {visibleColumns.includes('generated') && (
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(schedule.generatedUntil) ?? '-'}
                      </td>
                    )}
                    {visibleColumns.includes('status') && (
                      <td className="px-6 py-4">
                        <StatusBadge active={schedule.active} />
                      </td>
                    )}
                    {visibleColumns.includes('actions') && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => navigate(`/horarios/slots?scheduleId=${schedule.id}`)}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 rounded hover:bg-indigo-50"
                            title="Ver turnos"
                          >
                            <CalendarDays className="w-4 h-4" />
                          </button>
                          <PermissionGate permission="venue-schedules.manage">
                            <button
                              onClick={() => { setGenerateTarget(schedule); setGenerateUntil(''); }}
                              className="p-1.5 text-gray-400 hover:text-green-600 rounded hover:bg-green-50"
                              title="Generar turnos"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          </PermissionGate>
                          <PermissionGate permission="venue-schedules.manage">
                            <button
                              onClick={() => navigate(`/horarios/${schedule.id}/edit`)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50"
                              title="Editar horario"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          </PermissionGate>
                          <PermissionGate permission="venue-schedules.manage">
                            <button
                              onClick={() => setDeleteTarget(schedule)}
                              className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50"
                              title="Eliminar horario"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </PermissionGate>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Eliminar Horario"
        message={`¿Estás seguro de eliminar el horario "${deleteTarget?.name}"? Los turnos futuros serán eliminados.`}
        confirmLabel="Eliminar"
        variant="danger"
        isLoading={deleteSchedule.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {generateTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Generar turnos para "{generateTarget.name}"</h2>
            <div className="mb-4">
              <label className="label">Generar hasta</label>
              <input
                type="date"
                value={generateUntil}
                onChange={(e) => setGenerateUntil(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="input"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
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
