import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Shield, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRoles, useDeleteRole } from '@/hooks/queries/useRoles';
import PermissionGate from '@components/shared/PermissionGate';
import ConfirmDialog from '@components/shared/ConfirmDialog';
import DataToolbar from '@components/shared/DataToolbar';
import type { FilterRule, SortState } from '@components/shared/DataToolbar';
import { Spinner } from '@components/ui/Spinner';
import { useColumnVisibility } from '@/hooks/useColumnVisibility';
import type { ColumnDef } from '@/hooks/useColumnVisibility';
import type { RoleFilters, RoleWithPermissions } from '@/types/role.types';
import toast from 'react-hot-toast';

const SORT_FIELD_MAP: Record<string, string> = {
  name: 'name',
  system: 'isSystem',
  created: 'createdAt',
};

const columns: ColumnDef[] = [
  { key: 'name', label: 'Name', sortable: true, filterable: true, type: 'text' },
  { key: 'description', label: 'Description', sortable: false, filterable: true, type: 'text' },
  { key: 'permissions', label: 'Permissions', sortable: true, filterable: false },
  { key: 'system', label: 'System', sortable: true, filterable: true, type: 'select', options: [
    { label: 'Yes', value: 'true' }, { label: 'No', value: 'false' },
  ]},
  { key: 'created', label: 'Created At', sortable: true, filterable: true, type: 'date' },
  { key: 'actions', label: 'Actions', sortable: false, filterable: false },
];

export default function RolesListPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<RoleFilters>({ page: 1, limit: 10 });
  const [deleteTarget, setDeleteTarget] = useState<RoleWithPermissions | null>(null);

  const { data, isLoading, isError } = useRoles(filters);
  const deleteRole = useDeleteRole();

  const roles = data?.data ?? [];
  const meta = data?.meta ?? { page: 1, limit: 10, total: 0, totalPages: 0 };

  const { visibleColumns, toggleColumn, resetColumns } = useColumnVisibility('roles-columns', columns);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteRole.mutateAsync(deleteTarget.id);
      toast.success('Role deleted successfully');
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete role');
    }
  };

  const handlePage = (page: number) => {
    setFilters((f) => ({ ...f, page }));
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roles</h1>
          <p className="text-gray-500">Manage roles and their permissions</p>
        </div>
        <PermissionGate permission="roles.manage">
          <button className="btn-primary" onClick={() => navigate('/roles/create')}>
            <Plus className="w-4 h-4 mr-2" />
            Create Role
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
            const next: RoleFilters = { search: f.search, page: 1, limit: f.limit, sortBy: f.sortBy, sortDirection: f.sortDirection };
            for (const rule of rules) {
              if (rule.field === 'name') {
                next.name = rule.value;
              } else if (rule.field === 'description') {
                next.description = rule.value;
              } else if (rule.field === 'system') {
                next.isSystem = rule.value;
              }
            }
            return next;
          });
        }, [])}
        visibleColumns={visibleColumns}
        onToggleColumn={toggleColumn}
        onResetColumns={resetColumns}
      />

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : isError ? (
          <div className="px-6 py-12 text-center text-red-500">
            <p>Failed to load roles. Please try again.</p>
          </div>
        ) : roles.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No roles found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {visibleColumns.includes('name') && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                    )}
                    {visibleColumns.includes('description') && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                    )}
                    {visibleColumns.includes('permissions') && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Permissions
                      </th>
                    )}
                    {visibleColumns.includes('system') && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        System
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
                            {role.permissions.length} permission{role.permissions.length !== 1 ? 's' : ''}
                          </span>
                        </td>
                      )}
                      {visibleColumns.includes('system') && (
                        <td className="px-6 py-4">
                          {role.isSystem ? (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                              Yes
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">
                              No
                            </span>
                          )}
                        </td>
                      )}
                      {visibleColumns.includes('created') && (
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(role.createdAt).toLocaleDateString()}
                        </td>
                      )}
                      {visibleColumns.includes('actions') && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <PermissionGate permission="roles.manage">
                              <button
                                onClick={() => navigate(`/roles/${role.id}/edit`)}
                                className="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50"
                                title="Edit role"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                            </PermissionGate>
                            {!role.isSystem && (
                              <PermissionGate permission="roles.manage">
                                <button
                                  onClick={() => setDeleteTarget(role)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50"
                                  title="Delete role"
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
                  Showing {(meta.page - 1) * meta.limit + 1} to{' '}
                  {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} roles
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
        title="Delete Role"
        message={`Are you sure you want to delete the role "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteRole.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
