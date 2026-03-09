import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageHeader } from '@/hooks/usePageHeader';
import { Plus, MapPin, Eye, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useVenues, useDeleteVenue } from '@/hooks/queries/useVenues';
import { useSportTypes } from '@/hooks/queries/useSportTypes';
import PermissionGate from '@components/shared/PermissionGate';
import ConfirmDialog from '@components/shared/ConfirmDialog';
import { Spinner } from '@components/ui/Spinner';
import DataToolbar from '@components/shared/DataToolbar';
import type { FilterRule, SortState } from '@components/shared/DataToolbar';
import { useColumnVisibility } from '@/hooks/useColumnVisibility';
import type { ColumnDef } from '@/hooks/useColumnVisibility';
import type { Venue, VenueFilters } from '@/types/venue.types';
import { exportToCsv } from '@/lib/exportCsv';
import toast from 'react-hot-toast';

const columns: ColumnDef[] = [
  { key: 'name', label: 'Nombre', sortable: true, filterable: true, type: 'text' },
  { key: 'sportType', label: 'Tipo de Deporte', sortable: false, filterable: false },
  { key: 'players', label: 'Jugadores/turno', sortable: false, filterable: false },
  { key: 'schedule', label: 'Horario', sortable: false, filterable: false },
  {
    key: 'status', label: 'Estado', sortable: false, filterable: true, type: 'select', options: [
      { label: 'Activo', value: 'true' },
      { label: 'Inactivo', value: 'false' },
    ]
  },
  { key: 'actions', label: 'Acciones', sortable: false, filterable: false },
];

const SORT_FIELD_MAP: Record<string, string> = {
  name: 'name',
};

export default function VenuesListPage() {
  const navigate = useNavigate();

  const headerActions = useMemo(() => (
    <PermissionGate permission="venues.manage">
      <button className="btn-primary" onClick={() => navigate('/venues/create')}>
        <Plus className="w-4 h-4 mr-2" />
        Agregar Espacio
      </button>
    </PermissionGate>
  ), [navigate]);
  usePageHeader({ subtitle: 'Gestionar espacios del club', actions: headerActions });

  const [filters, setFilters] = useState<VenueFilters>({ page: 1, limit: 10 });
  const [deleteTarget, setDeleteTarget] = useState<Venue | null>(null);
  const [selectedSportTypeId, setSelectedSportTypeId] = useState<string>('');

  const { visibleColumns, toggleColumn, resetColumns } = useColumnVisibility('venues-columns', columns);

  const { data, isLoading, isError } = useVenues(filters);
  const { data: sportTypesData } = useSportTypes({ active: 'true', limit: 100 });
  const deleteVenue = useDeleteVenue();

  const items = data?.data ?? [];
  const meta = data?.meta ?? { page: 1, limit: 10, total: 0, totalPages: 0 };
  const sportTypes = sportTypesData?.data ?? [];

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteVenue.mutateAsync(deleteTarget.id);
      toast.success('Espacio eliminado exitosamente');
      setDeleteTarget(null);
    } catch {
      toast.error('Error al eliminar el espacio');
    }
  };

  const handlePage = (page: number) => {
    setFilters((f) => ({ ...f, page }));
  };

  const handleSportTypeFilter = (sportTypeId: string) => {
    setSelectedSportTypeId(sportTypeId);
    setFilters((f) => ({ ...f, sportTypeId: sportTypeId || undefined, page: 1 }));
  };

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">Filtrar por deporte:</label>
        <select
          value={selectedSportTypeId}
          onChange={(e) => handleSportTypeFilter(e.target.value)}
          className="input max-w-xs"
        >
          <option value="">Todos los deportes</option>
          {sportTypes.map((st) => (
            <option key={st.id} value={st.id}>{st.name}</option>
          ))}
        </select>
      </div>

      <DataToolbar
        columns={columns}
        onSearchChange={useCallback((search: string) => setFilters((f) => ({ ...f, search: search || undefined, page: 1 })), [])}
        onSortChange={useCallback((sort: SortState | null) => {
          setFilters((f) => ({
            ...f,
            sortBy: sort ? SORT_FIELD_MAP[sort.field] || sort.field : undefined,
            sortDirection: sort?.direction,
            page: 1,
          }));
        }, [])}
        onFiltersChange={useCallback((rules: FilterRule[]) => {
          setFilters((f) => {
            const next: VenueFilters = { search: f.search, page: 1, limit: f.limit, sportTypeId: f.sportTypeId };
            for (const rule of rules) {
              if (rule.field === 'status' && (rule.operator === 'eq' || rule.operator === 'neq')) {
                next.active = rule.value as 'true' | 'false';
              }
            }
            return next;
          });
        }, [])}
        visibleColumns={visibleColumns}
        onToggleColumn={toggleColumn}
        onResetColumns={resetColumns}
        onExport={() => {
          const headers = columns.filter((c) => c.key !== 'actions' && visibleColumns.includes(c.key)).map((c) => c.label);
          const rows = items.map((item) => columns.filter((c) => c.key !== 'actions' && visibleColumns.includes(c.key)).map((c) => {
            if (c.key === 'name') return item.name;
            if (c.key === 'sportType') return item.sportType.name;
            if (c.key === 'players') return String(item.playersPerSlot);
            if (c.key === 'schedule') return `${item.openTime} - ${item.closeTime}`;
            if (c.key === 'status') return item.active ? 'Activo' : 'Inactivo';
            return '';
          }));
          exportToCsv('espacios', headers, rows);
        }}
      />

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : isError ? (
          <div className="px-6 py-12 text-center text-red-500">
            <p>No se pudieron cargar los espacios. Por favor, inténtalo de nuevo.</p>
          </div>
        ) : items.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No se encontraron espacios</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {visibleColumns.includes('name') && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                    )}
                    {visibleColumns.includes('sportType') && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo de Deporte</th>
                    )}
                    {visibleColumns.includes('players') && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jugadores/turno</th>
                    )}
                    {visibleColumns.includes('schedule') && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Horario</th>
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
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      {visibleColumns.includes('name') && (
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{item.name}</p>
                            {item.description && (
                              <p className="text-xs text-gray-500">{item.description}</p>
                            )}
                          </div>
                        </td>
                      )}
                      {visibleColumns.includes('sportType') && (
                        <td className="px-6 py-4">
                          <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded">
                            {item.sportType.name}
                          </span>
                        </td>
                      )}
                      {visibleColumns.includes('players') && (
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {item.playersPerSlot}
                        </td>
                      )}
                      {visibleColumns.includes('schedule') && (
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {item.openTime} - {item.closeTime}
                        </td>
                      )}
                      {visibleColumns.includes('status') && (
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${item.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                            {item.active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                      )}
                      {visibleColumns.includes('actions') && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => navigate(`/venues/${item.id}`)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50"
                              title="Ver espacio"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <PermissionGate permission="venues.manage">
                              <button
                                onClick={() => navigate(`/venues/${item.id}/edit`)}
                                className="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50"
                                title="Editar espacio"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                            </PermissionGate>
                            <PermissionGate permission="venues.manage">
                              <button
                                onClick={() => setDeleteTarget(item)}
                                className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50"
                                title="Eliminar espacio"
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
                  {Math.min(meta.page * meta.limit, meta.total)} de {meta.total} espacios
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePage(meta.page - 1)}
                    disabled={meta.page <= 1}
                    className="p-1.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePage(page)}
                      className={`px-3 py-1 text-sm rounded ${page === meta.page ? 'bg-blue-600 text-white' : 'border border-gray-300 hover:bg-gray-50'}`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePage(meta.page + 1)}
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
        title="Eliminar Espacio"
        message={`¿Estás seguro de que querés eliminar "${deleteTarget?.name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="danger"
        isLoading={deleteVenue.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
