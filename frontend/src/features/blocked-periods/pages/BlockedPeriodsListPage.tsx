import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageHeader } from '@/hooks/usePageHeader';
import { Plus, Ban, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blockedPeriodsApi } from '@api/blockedPeriods.api';
import type { BlockedPeriod } from '@api/blockedPeriods.api';
import PermissionGate from '@components/shared/PermissionGate';
import ConfirmDialog from '@components/shared/ConfirmDialog';
import { Spinner } from '@components/ui/Spinner';
import DataToolbar from '@components/shared/DataToolbar';
import { useColumnVisibility } from '@/hooks/useColumnVisibility';
import type { ColumnDef } from '@/hooks/useColumnVisibility';
import toast from 'react-hot-toast';
import { formatDate } from '@lib/formatDate';

const columns: ColumnDef[] = [
  { key: 'reason', label: 'Razón', sortable: false, filterable: true, type: 'text' },
  { key: 'from', label: 'Desde', sortable: false, filterable: false },
  { key: 'to', label: 'Hasta', sortable: false, filterable: false },
  { key: 'timeRange', label: 'Franja horaria', sortable: false, filterable: false },
  { key: 'appliesTo', label: 'Aplica a', sortable: false, filterable: false },
  {
    key: 'status', label: 'Estado', sortable: false, filterable: true, type: 'select', options: [
      { label: 'Activo', value: 'true' },
      { label: 'Inactivo', value: 'false' },
    ]
  },
  { key: 'actions', label: 'Acciones', sortable: false, filterable: false },
];

export default function BlockedPeriodsListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const headerActions = useMemo(() => (
    <PermissionGate permission="blocked-periods.manage">
      <button className="btn-primary" onClick={() => navigate('/blocked-periods/create')}>
        <Plus className="w-4 h-4 mr-2" />
        Nuevo Período
      </button>
    </PermissionGate>
  ), [navigate]);
  usePageHeader({ subtitle: 'Bloquear días o franjas horarias', actions: headerActions });

  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<BlockedPeriod | null>(null);

  const { visibleColumns, toggleColumn, resetColumns } = useColumnVisibility('blocked-periods-columns', columns);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['blocked-periods', page],
    queryFn: () => blockedPeriodsApi.getBlockedPeriods({ page, limit: 10 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => blockedPeriodsApi.deleteBlockedPeriod(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-periods'] });
      toast.success('Período bloqueado eliminado exitosamente');
      setDeleteTarget(null);
    },
    onError: () => toast.error('Error al eliminar el período bloqueado'),
  });

  const periods = data?.data ?? [];
  const meta = data?.meta ?? { page: 1, limit: 10, total: 0, totalPages: 0 };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id);
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
      />

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : isError ? (
          <div className="px-6 py-12 text-center text-red-500">
            <p>No se pudieron cargar los períodos bloqueados. Por favor, inténtalo de nuevo.</p>
          </div>
        ) : periods.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <Ban className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No hay períodos bloqueados</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {visibleColumns.includes('reason') && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Razón</th>
                    )}
                    {visibleColumns.includes('from') && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Desde</th>
                    )}
                    {visibleColumns.includes('to') && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hasta</th>
                    )}
                    {visibleColumns.includes('timeRange') && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Franja horaria</th>
                    )}
                    {visibleColumns.includes('appliesTo') && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aplica a</th>
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
                  {periods.map((period) => (
                    <tr key={period.id} className="hover:bg-gray-50">
                      {visibleColumns.includes('reason') && (
                        <td className="px-6 py-4 text-sm text-gray-900">{period.reason ?? '-'}</td>
                      )}
                      {visibleColumns.includes('from') && (
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDate(period.startDate)}
                        </td>
                      )}
                      {visibleColumns.includes('to') && (
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDate(period.endDate)}
                        </td>
                      )}
                      {visibleColumns.includes('timeRange') && (
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {period.startTime && period.endTime
                            ? `${period.startTime} - ${period.endTime}`
                            : 'Todo el día'}
                        </td>
                      )}
                      {visibleColumns.includes('appliesTo') && (
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {period.venue
                            ? period.venue.name
                            : period.sportType
                            ? period.sportType.name
                            : 'Todos'}
                        </td>
                      )}
                      {visibleColumns.includes('status') && (
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${period.active ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                            {period.active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                      )}
                      {visibleColumns.includes('actions') && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <PermissionGate permission="blocked-periods.manage">
                              <button
                                onClick={() => navigate(`/blocked-periods/${period.id}/edit`)}
                                className="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50"
                                title="Editar"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                            </PermissionGate>
                            <PermissionGate permission="blocked-periods.manage">
                              <button
                                onClick={() => setDeleteTarget(period)}
                                className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50"
                                title="Eliminar"
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

            {meta.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Mostrando {(meta.page - 1) * meta.limit + 1} a{' '}
                  {Math.min(meta.page * meta.limit, meta.total)} de {meta.total} períodos
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => p - 1)}
                    disabled={meta.page <= 1}
                    className="p-1.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`px-3 py-1 text-sm rounded ${p === meta.page ? 'bg-blue-600 text-white' : 'border border-gray-300 hover:bg-gray-50'}`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={meta.page >= meta.totalPages}
                    className="p-1.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Eliminar Período Bloqueado"
        message="¿Estás seguro? Los turnos bloqueados por este período volverán a estar disponibles."
        confirmLabel="Eliminar"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
