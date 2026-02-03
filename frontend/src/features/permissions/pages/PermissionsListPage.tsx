import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Shield, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePermissions, useDeletePermission, useBulkDeletePermissions } from '@/hooks/queries/usePermissions';
import PermissionGate from '@components/shared/PermissionGate';
import ConfirmDialog from '@components/shared/ConfirmDialog';
import DataToolbar from '@components/shared/DataToolbar';
import type { FilterRule, SortState } from '@components/shared/DataToolbar';
import { Spinner } from '@components/ui/Spinner';
import { useColumnVisibility } from '@/hooks/useColumnVisibility';
import type { ColumnDef } from '@/hooks/useColumnVisibility';
import type { Permission, PermissionFilters } from '@/types/role.types';
import { exportToCsv } from '@/lib/exportCsv';
import toast from 'react-hot-toast';

const SORT_FIELD_MAP: Record<string, string> = {
  resource: 'resource',
  action: 'action',
  created: 'createdAt',
};

const columns: ColumnDef[] = [
  { key: 'resource', label: 'Resource', sortable: true, filterable: true, type: 'text' },
  { key: 'action', label: 'Action', sortable: true, filterable: true, type: 'text' },
  { key: 'description', label: 'Description', sortable: false, filterable: true, type: 'text' },
  { key: 'created', label: 'Created At', sortable: true, filterable: true, type: 'date' },
  { key: 'actions', label: 'Actions', sortable: false, filterable: false },
];

export default function PermissionsListPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<PermissionFilters>({ page: 1, limit: 10 });
  const [deleteTarget, setDeleteTarget] = useState<Permission | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data, isLoading, isError } = usePermissions(filters);
  const deletePermission = useDeletePermission();
  const bulkDelete = useBulkDeletePermissions();
  const { visibleColumns, toggleColumn, resetColumns } = useColumnVisibility('permissions-columns', columns);

  const permissions = data?.data ?? [];
  const meta = data?.meta ?? { page: 1, limit: 10, total: 0, totalPages: 0 };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deletePermission.mutateAsync(deleteTarget.id);
      toast.success('Permission deleted successfully');
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete permission');
    }
  };

  const handlePage = (page: number) => {
    setFilters((f) => ({ ...f, page }));
    setSelectedIds(new Set());
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Permissions</h1>
          <p className="text-gray-500">Manage system permissions and access controls</p>
        </div>
        <PermissionGate permission="roles.manage">
          <button className="btn-primary" onClick={() => navigate('/permissions/create')}>
            <Plus className="w-4 h-4 mr-2" />
            Create Permission
          </button>
        </PermissionGate>
      </div>

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
            const next: PermissionFilters = { search: f.search, page: 1, limit: f.limit, sortBy: f.sortBy, sortDirection: f.sortDirection };
            for (const rule of rules) {
              if (rule.field === 'resource') {
                next.resource = rule.value;
              } else if (rule.field === 'action') {
                next.action = rule.value;
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
          const rows = permissions.map((p) => columns.filter((c) => c.key !== 'actions' && visibleColumns.includes(c.key)).map((c) => {
            if (c.key === 'resource') return p.resource;
            if (c.key === 'action') return p.action;
            if (c.key === 'description') return p.description || '';
            if (c.key === 'created') return new Date(p.createdAt).toLocaleDateString();
            return '';
          }));
          exportToCsv('permissions', headers, rows);
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
            <p>Failed to load permissions. Please try again.</p>
          </div>
        ) : permissions.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No permissions found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {visibleColumns.includes('resource') && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Resource
                      </th>
                    )}
                    {visibleColumns.includes('action') && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    )}
                    {visibleColumns.includes('description') && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                    )}
                    {visibleColumns.includes('created') && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created At
                      </th>
                    )}
                    {visibleColumns.includes('actions') && (
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {permissions.map((permission) => (
                    <tr key={permission.id} className="hover:bg-gray-50">
                      {visibleColumns.includes('resource') && (
                        <td className="px-6 py-4">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold bg-blue-50 text-blue-700 rounded">
                            {permission.resource}
                          </span>
                        </td>
                      )}
                      {visibleColumns.includes('action') && (
                        <td className="px-6 py-4">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-700 rounded">
                            {permission.action}
                          </span>
                        </td>
                      )}
                      {visibleColumns.includes('description') && (
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {permission.description || '-'}
                        </td>
                      )}
                      {visibleColumns.includes('created') && (
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(permission.createdAt).toLocaleDateString()}
                        </td>
                      )}
                      {visibleColumns.includes('actions') && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <PermissionGate permission="roles.manage">
                              <button
                                onClick={() => navigate(`/permissions/${permission.id}/edit`)}
                                className="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50"
                                title="Edit permission"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                            </PermissionGate>
                            <PermissionGate permission="roles.manage">
                              <button
                                onClick={() => setDeleteTarget(permission)}
                                className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50"
                                title="Delete permission"
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

            {/* Pagination */}
            {meta.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Showing {(meta.page - 1) * meta.limit + 1} to{' '}
                  {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} permissions
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
        title="Delete Permission"
        message={`Are you sure you want to delete the permission "${deleteTarget?.resource}.${deleteTarget?.action}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deletePermission.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
