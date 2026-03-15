import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageHeader } from '@/hooks/usePageHeader';
import { Plus, Shield, Eye, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRoles, useDeleteRole, useBulkDeleteRoles } from '@/hooks/queries/useRoles';
import PermissionGate from '@components/shared/PermissionGate';
import ConfirmDialog from '@components/shared/ConfirmDialog';
import DataToolbar from '@components/shared/DataToolbar';
import type { FilterRule, SortState } from '@components/shared/DataToolbar';
import { Spinner } from '@components/ui/Spinner';
import { useColumnVisibility } from '@/hooks/useColumnVisibility';
import type { ColumnDef } from '@/hooks/useColumnVisibility';
import type { RoleFilters, RoleWithPermissions } from '@/types/role.types';
import { exportToCsv } from '@/lib/exportCsv';
import toast from 'react-hot-toast';
import { formatDateTime } from '@lib/formatDate';

const SORT_FIELD_MAP: Record<string, string> = {
  name: 'name',
  created: 'createdAt',
};

const columns: ColumnDef[] = [
  { key: 'name', label: 'Nombre', sortable: true, filterable: true, type: 'text' },
  { key: 'description', label: 'Descripción', sortable: false, filterable: true, type: 'text' },
  { key: 'permissions', label: 'Permisos', sortable: false, filterable: false },
  { key: 'created', label: 'Creado', sortable: true, filterable: true, type: 'date' },
  { key: 'actions', label: 'Acciones', sortable: false, filterable: false },
];

export default function RolesListPage() {
  const navigate = useNavigate();

  const headerActions = useMemo(() => (
    <PermissionGate permission="roles.manage">
      <button className="btn-primary" onClick={() => navigate('/roles/create')}>
        <Plus className="w-4 h-4 mr-2" />
        Crear Rol
      </button>
    </PermissionGate>
  ), [navigate]);
  usePageHeader({ subtitle: 'Gestionar roles y sus permisos', actions: headerActions });

  const [filters, setFilters] = useState<RoleFilters>({ page: 1, limit: 10 });
  const [deleteTarget, setDeleteTarget] = useState<RoleWithPermissions | null>(null);
  const [, setSelectedIds] = useState<Set<string>>(new Set());

  const { data, isLoading, isError } = useRoles(filters);
  const deleteRole = useDeleteRole();
  useBulkDeleteRoles();

  const roles = data?.data ?? [];
  const meta = data?.meta ?? { page: 1, limit: 10, total: 0, totalPages: 0 };

  const { visibleColumns, toggleColumn, resetColumns } = useColumnVisibility('roles-columns', columns);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteRole.mutateAsync(deleteTarget.id);
      toast.success('Rol eliminado exitosamente');
      setDeleteTarget(null);
    } catch {
      toast.error('Error al eliminar el rol');
    }
  };

  const handlePage = (page: number) => {
    setFilters((f) => ({ ...f, page }));
    setSelectedIds(new Set());
  };

  return (
    <div>
      {/* Header managed by Topbar */}

      {/* Toolbar */}
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
            const next: RoleFilters = { search: f.search, page: 1, limit: f.limit, sortBy: f.sortBy, sortDirection: f.sortDirection };
            for (const rule of rules) {
              if (rule.field === 'name') {
                next.name = rule.value;
              } else if (rule.field === 'description') {
                next.description = rule.value;
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
          const rows = roles.map((r) => columns.filter((c) => c.key !== 'actions' && visibleColumns.includes(c.key)).map((c) => {
            if (c.key === 'name') return r.name;
            if (c.key === 'description') return r.description || '';
            if (c.key === 'permissions') return `${r.permissions.length}`;
            if (c.key === 'created') return formatDateTime(r.createdAt);
            return '';
          }));
          exportToCsv('roles', headers, rows);
        }}
      />

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : isError ? (
          <div className="px-6 py-12 text-center text-red-500">
            <p>No se pudieron cargar los roles. Por favor, inténtalo de nuevo.</p>
          </div>
        ) : roles.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No hay roles registrados</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {visibleColumns.includes('name') && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nombre
                      </th>
                    )}
                    {visibleColumns.includes('description') && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Descripción
                      </th>
                    )}
                    {visibleColumns.includes('permissions') && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Permisos
                      </th>
                    )}
                    {visibleColumns.includes('created') && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Creado
                      </th>
                    )}
                    {visibleColumns.includes('actions') && (
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {roles.map((role) => (
                    <tr key={role.id} className="hover:bg-gray-50">
                      {visibleColumns.includes('name') && (
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-medium">
                              <Shield className="w-4 h-4" />
                            </div>
                            <span className="ml-3 text-sm font-medium text-gray-900">
                              {role.name}
                            </span>
                          </div>
                        </td>
                      )}
                      {visibleColumns.includes('description') && (
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {role.description || '-'}
                        </td>
                      )}
                      {visibleColumns.includes('permissions') && (
                        <td className="px-6 py-4">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                            {role.permissions.length} {role.permissions.length !== 1 ? 'permisos' : 'permiso'}
                          </span>
                        </td>
                      )}
                      {visibleColumns.includes('created') && (
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDateTime(role.createdAt)}
                        </td>
                      )}
                      {visibleColumns.includes('actions') && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => navigate(`/roles/${role.id}`)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50"
                              title="Ver rol"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <PermissionGate permission="roles.manage">
                              <button
                                onClick={() => navigate(`/roles/${role.id}?tab=general`)}
                                className="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50"
                                title="Editar rol"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                            </PermissionGate>
                            {!role.isSystem && (
                              <PermissionGate permission="roles.manage">
                                <button
                                  onClick={() => setDeleteTarget(role)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50"
                                  title="Eliminar rol"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </PermissionGate>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {meta.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Mostrando {(meta.page - 1) * meta.limit + 1} a{' '}
                  {Math.min(meta.page * meta.limit, meta.total)} de {meta.total} roles
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
                      className={`px-3 py-1 text-sm rounded ${
                        page === meta.page
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
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

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Eliminar Rol"
        message={`¿Estás seguro de que deseas eliminar el rol "${deleteTarget?.name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="danger"
        isLoading={deleteRole.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
