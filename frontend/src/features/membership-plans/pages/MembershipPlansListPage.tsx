import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageHeader } from '@/hooks/usePageHeader';
import { Plus, CreditCard, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMembershipPlans, useDeleteMembershipPlan } from '@/hooks/queries/useMembershipPlans';
import { useSportTypes } from '@/hooks/queries/useSportTypes';
import PermissionGate from '@components/shared/PermissionGate';
import ConfirmDialog from '@components/shared/ConfirmDialog';
import { Spinner } from '@components/ui/Spinner';
import DataToolbar from '@components/shared/DataToolbar';
import type { FilterRule, QuickFilter } from '@components/shared/DataToolbar';
import { useColumnVisibility } from '@/hooks/useColumnVisibility';
import type { ColumnDef } from '@/hooks/useColumnVisibility';
import type { MembershipPlan, MembershipPlanFilters } from '@/types/membership-plan.types';
import toast from 'react-hot-toast';

const columns: ColumnDef[] = [
  { key: 'name', label: 'Nombre', sortable: true, filterable: true, type: 'text' },
  { key: 'price', label: 'Precio', sortable: false, filterable: false },
  { key: 'limit', label: 'Límite mensual', sortable: false, filterable: false },
  { key: 'sport', label: 'Deporte', sortable: false, filterable: false },
  {
    key: 'status', label: 'Estado', sortable: false, filterable: true, type: 'select', options: [
      { label: 'Activo', value: 'true' },
      { label: 'Inactivo', value: 'false' },
    ]
  },
  { key: 'actions', label: 'Acciones', sortable: false, filterable: false },
];

export default function MembershipPlansListPage() {
  const navigate = useNavigate();

  const headerActions = useMemo(() => (
    <PermissionGate permission="membership-plans.manage">
      <button className="btn-primary" onClick={() => navigate('/planes-membresia/create')}>
        <Plus className="w-4 h-4 mr-2" />
        Agregar Plan
      </button>
    </PermissionGate>
  ), [navigate]);
  usePageHeader({ subtitle: 'Gestionar planes de membresía del club', actions: headerActions });

  const [filters, setFilters] = useState<MembershipPlanFilters>({ page: 1, limit: 10 });
  const [deleteTarget, setDeleteTarget] = useState<MembershipPlan | null>(null);
  const [sportTypeFilter, setSportTypeFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');

  const { visibleColumns, toggleColumn, resetColumns } = useColumnVisibility('membership-plans-columns', columns);

  const { data, isLoading, isError } = useMembershipPlans(filters);
  const { data: sportTypesData } = useSportTypes({ active: 'true', limit: 100 });
  const deletePlan = useDeleteMembershipPlan();

  const items = data?.data ?? [];
  const meta = data?.meta ?? { page: 1, limit: 10, total: 0, totalPages: 0 };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deletePlan.mutateAsync(deleteTarget.id);
      toast.success('Plan eliminado exitosamente');
      setDeleteTarget(null);
    } catch {
      toast.error('Error al eliminar el plan');
    }
  };

  const handlePage = (page: number) => {
    setFilters((f) => ({ ...f, page }));
  };

  return (
    <div>
      <DataToolbar
        columns={columns}
        onSearchChange={useCallback((search: string) => setFilters((f) => ({ ...f, search: search || undefined, page: 1 })), [])}
        onSortChange={useCallback(() => {}, [])}
        quickFilters={useMemo<QuickFilter[]>(() => [
          {
            key: 'sportType',
            label: 'Tipo de deporte',
            value: sportTypeFilter,
            onChange: (v) => { setSportTypeFilter(v); setFilters((f) => ({ ...f, sportTypeId: v || undefined, page: 1 })); },
            options: (sportTypesData?.data ?? []).map((st) => ({ label: st.name, value: st.id })),
          },
          {
            key: 'active',
            label: 'Estado',
            value: activeFilter,
            onChange: (v) => { setActiveFilter(v); setFilters((f) => ({ ...f, active: v as 'true' | 'false' | undefined || undefined, page: 1 })); },
            options: [{ label: 'Activo', value: 'true' }, { label: 'Inactivo', value: 'false' }],
          },
        ], [sportTypeFilter, activeFilter, sportTypesData?.data])}
        onFiltersChange={useCallback((rules: FilterRule[]) => {
          setFilters((f) => {
            const next: MembershipPlanFilters = { search: f.search, page: 1, limit: f.limit };
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
      />

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : isError ? (
          <div className="px-6 py-12 text-center text-red-500">
            <p>No se pudieron cargar los planes. Por favor, inténtalo de nuevo.</p>
          </div>
        ) : items.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No se encontraron planes de membresía</p>
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
                    {visibleColumns.includes('price') && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                    )}
                    {visibleColumns.includes('limit') && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Límite mensual</th>
                    )}
                    {visibleColumns.includes('sport') && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deporte</th>
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
                      {visibleColumns.includes('price') && (
                        <td className="px-6 py-4 text-sm text-gray-700">
                          ${Number(item.price).toLocaleString('es-AR')}
                        </td>
                      )}
                      {visibleColumns.includes('limit') && (
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {item.monthlyReservationLimit != null ? `${item.monthlyReservationLimit} reservas` : 'Sin límite'}
                        </td>
                      )}
                      {visibleColumns.includes('sport') && (
                        <td className="px-6 py-4">
                          {item.sportType ? (
                            <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded">
                              {item.sportType.name}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
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
                            <PermissionGate permission="membership-plans.manage">
                              <button
                                onClick={() => navigate(`/planes-membresia/${item.id}/edit`)}
                                className="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50"
                                title="Editar"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                            </PermissionGate>
                            <PermissionGate permission="membership-plans.manage">
                              <button
                                onClick={() => setDeleteTarget(item)}
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
                  {Math.min(meta.page * meta.limit, meta.total)} de {meta.total} planes
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
        title="Eliminar Plan de Membresía"
        message={`¿Estás seguro de que quieres eliminar "${deleteTarget?.name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="danger"
        isLoading={deletePlan.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
