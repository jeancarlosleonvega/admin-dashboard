import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageHeader } from '@/hooks/usePageHeader';
import { Plus, GitBranch, Pencil, Trash2, Lock, Eye } from 'lucide-react';
import { OPERATOR_DISPLAY } from '@lib/operatorLabels';
import { useConditionTypes, useDeleteConditionType } from '@/hooks/queries/useConditionTypes';
import PermissionGate from '@components/shared/PermissionGate';
import ConfirmDialog from '@components/shared/ConfirmDialog';
import { Spinner } from '@components/ui/Spinner';
import DataToolbar from '@components/shared/DataToolbar';
import type { FilterRule, SortState } from '@components/shared/DataToolbar';
import { useColumnVisibility } from '@/hooks/useColumnVisibility';
import type { ColumnDef } from '@/hooks/useColumnVisibility';
import type { ConditionTypeFilters, ConditionType } from '@api/conditionTypes.api';
import toast from 'react-hot-toast';

const DATA_TYPE_LABELS: Record<string, string> = {
  NUMBER: 'Número',
  STRING: 'Texto',
  UUID: 'UUID',
  ENUM: 'Enumerado',
};

const SORT_FIELD_MAP: Record<string, string> = {
  name: 'name',
  key: 'key',
  dataType: 'dataType',
  created: 'createdAt',
};

const columns: ColumnDef[] = [
  { key: 'name', label: 'Nombre', sortable: true, filterable: true, type: 'text' },
  { key: 'key', label: 'Key', sortable: true, filterable: true, type: 'text' },
  { key: 'dataType', label: 'Tipo de dato', sortable: true, filterable: true, type: 'select', options: [
    { label: 'Número', value: 'NUMBER' },
    { label: 'Texto', value: 'STRING' },
    { label: 'UUID', value: 'UUID' },
    { label: 'Enumerado', value: 'ENUM' },
  ]},
  { key: 'operators', label: 'Operadores', sortable: false, filterable: false },
  { key: 'status', label: 'Estado', sortable: false, filterable: true, type: 'select', options: [
    { label: 'Activo', value: 'true' },
    { label: 'Inactivo', value: 'false' },
  ]},
  { key: 'actions', label: 'Acciones', sortable: false, filterable: false },
];

export default function ConditionTypesListPage() {
  const navigate = useNavigate();

  const headerActions = useMemo(() => (
    <PermissionGate permission="condition-types.manage">
      <button className="btn-primary" onClick={() => navigate('/tipos-condicion/create')}>
        <Plus className="w-4 h-4 mr-2" />
        Agregar Tipo de Condición
      </button>
    </PermissionGate>
  ), [navigate]);
  usePageHeader({ subtitle: 'Gestionar tipos de condición para reglas de acceso', actions: headerActions });

  const [filters, setFilters] = useState<ConditionTypeFilters>({ page: 1, limit: 20 });
  const [deleteTarget, setDeleteTarget] = useState<ConditionType | null>(null);

  const { visibleColumns, toggleColumn, resetColumns } = useColumnVisibility('condition-types-columns', columns);

  const { data, isLoading, isError } = useConditionTypes(filters);
  const deleteConditionType = useDeleteConditionType();

  const items = data?.data ?? [];
  const meta = data?.meta ?? { page: 1, limit: 20, total: 0, totalPages: 0 };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteConditionType.mutateAsync(deleteTarget.id);
      toast.success('Tipo de condición eliminado exitosamente');
      setDeleteTarget(null);
    } catch {
      toast.error('Error al eliminar el tipo de condición');
    }
  };

  return (
    <div>
      <DataToolbar
        columns={columns}
        onSearchChange={useCallback((search: string) => setFilters((f) => ({ ...f, search: search || undefined, page: 1 })), [])}
        onSortChange={useCallback((sort: SortState | null) => {
          setFilters((f) => ({
            ...f,
            sortBy: sort ? SORT_FIELD_MAP[sort.field] ?? sort.field : undefined,
            sortDirection: sort?.direction,
            page: 1,
          }));
        }, [])}
        onFiltersChange={useCallback((rules: FilterRule[]) => {
          setFilters((f) => {
            const next: ConditionTypeFilters = { search: f.search, page: 1, limit: f.limit, sortBy: f.sortBy, sortDirection: f.sortDirection };
            for (const rule of rules) {
              if (rule.field === 'dataType') next.dataType = rule.value;
              if (rule.field === 'status') next.active = rule.value as 'true' | 'false';
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
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : isError ? (
          <div className="px-6 py-12 text-center text-red-500"><p>No se pudieron cargar los tipos de condición.</p></div>
        ) : items.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <GitBranch className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No se encontraron tipos de condición</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {visibleColumns.includes('name') && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>}
                    {visibleColumns.includes('key') && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key</th>}
                    {visibleColumns.includes('dataType') && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo de dato</th>}
                    {visibleColumns.includes('operators') && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operadores</th>}
                    {visibleColumns.includes('status') && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>}
                    {visibleColumns.includes('actions') && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      {visibleColumns.includes('name') && (
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900">{item.name}</p>
                            {item.isSystem && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs rounded bg-amber-50 text-amber-700 border border-amber-200">
                                <Lock className="w-2.5 h-2.5" />
                                Sistema
                              </span>
                            )}
                          </div>
                          {item.description && <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>}
                        </td>
                      )}
                      {visibleColumns.includes('key') && (
                        <td className="px-6 py-4 text-sm text-gray-500 font-mono">{item.key}</td>
                      )}
                      {visibleColumns.includes('dataType') && (
                        <td className="px-6 py-4 text-sm text-gray-700">{DATA_TYPE_LABELS[item.dataType] ?? item.dataType}</td>
                      )}
                      {visibleColumns.includes('operators') && (
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {item.allowedOperators.map((op) => (
                              <span key={op} className="inline-flex px-1.5 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">
                                {OPERATOR_DISPLAY[op] ?? op}
                              </span>
                            ))}
                          </div>
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
                          {item.isSystem ? (
                            <button
                              onClick={() => navigate(`/tipos-condicion/${item.id}/edit`)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50"
                              title="Ver detalle"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          ) : (
                            <div className="flex justify-end gap-2">
                              <PermissionGate permission="condition-types.manage">
                                <button
                                  onClick={() => navigate(`/tipos-condicion/${item.id}/edit`)}
                                  className="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50"
                                  title="Editar"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                              </PermissionGate>
                              <PermissionGate permission="condition-types.manage">
                                <button
                                  onClick={() => setDeleteTarget(item)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </PermissionGate>
                            </div>
                          )}
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
                  Mostrando {(meta.page - 1) * meta.limit + 1} a {Math.min(meta.page * meta.limit, meta.total)} de {meta.total}
                </p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))} disabled={(filters.page ?? 1) <= 1} className="p-1.5 rounded border border-gray-300 disabled:opacity-50">
                    ‹
                  </button>
                  {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
                    <button key={p} onClick={() => setFilters((f) => ({ ...f, page: p }))} className={`px-3 py-1 text-sm rounded ${p === meta.page ? 'bg-blue-600 text-white' : 'border border-gray-300 hover:bg-gray-50'}`}>
                      {p}
                    </button>
                  ))}
                  <button onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))} disabled={(filters.page ?? 1) >= meta.totalPages} className="p-1.5 rounded border border-gray-300 disabled:opacity-50">
                    ›
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Eliminar Tipo de Condición"
        message={`¿Estás seguro de que querés eliminar "${deleteTarget?.name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="danger"
        isLoading={deleteConditionType.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
