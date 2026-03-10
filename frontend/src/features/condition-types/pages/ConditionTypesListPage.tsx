import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageHeader } from '@/hooks/usePageHeader';
import { Plus, GitBranch, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useConditionTypes, useDeleteConditionType } from '@/hooks/queries/useConditionTypes';
import PermissionGate from '@components/shared/PermissionGate';
import ConfirmDialog from '@components/shared/ConfirmDialog';
import { Spinner } from '@components/ui/Spinner';
import toast from 'react-hot-toast';
import type { ConditionType } from '@api/conditionTypes.api';

const DATA_TYPE_LABELS: Record<string, string> = {
  NUMBER: 'Número',
  STRING: 'Texto',
  UUID: 'UUID',
  ENUM: 'Enumerado',
};

export default function ConditionTypesListPage() {
  const navigate = useNavigate();

  const headerActions = useMemo(() => (
    <PermissionGate permission="condition-types.manage">
      <button className="btn-primary" onClick={() => navigate('/condition-types/create')}>
        <Plus className="w-4 h-4 mr-2" />
        Agregar Tipo de Condición
      </button>
    </PermissionGate>
  ), [navigate]);
  usePageHeader({ subtitle: 'Gestionar tipos de condición para reglas de acceso', actions: headerActions });

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ConditionType | null>(null);

  const { data, isLoading, isError } = useConditionTypes({ page, limit: 20, search: search || undefined });
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
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar..."
          value={search}
          onChange={useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
            setSearch(e.target.value);
            setPage(1);
          }, [])}
          className="input max-w-xs"
        />
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : isError ? (
          <div className="px-6 py-12 text-center text-red-500">
            <p>No se pudieron cargar los tipos de condición.</p>
          </div>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo de dato</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operadores</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.name}</p>
                          {item.description && <p className="text-xs text-gray-500">{item.description}</p>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 font-mono">{item.key}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{DATA_TYPE_LABELS[item.dataType] ?? item.dataType}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {item.allowedOperators.map((op) => (
                            <span key={op} className="inline-flex px-1.5 py-0.5 text-xs font-mono bg-gray-100 text-gray-700 rounded">
                              {op}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${item.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                          {item.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <PermissionGate permission="condition-types.manage">
                            <button
                              onClick={() => navigate(`/condition-types/${item.id}/edit`)}
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {meta.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Mostrando {(meta.page - 1) * meta.limit + 1} a{' '}
                  {Math.min(meta.page * meta.limit, meta.total)} de {meta.total}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(meta.page - 1)}
                    disabled={meta.page <= 1}
                    className="p-1.5 rounded border border-gray-300 disabled:opacity-50"
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
                    onClick={() => setPage(meta.page + 1)}
                    disabled={meta.page >= meta.totalPages}
                    className="p-1.5 rounded border border-gray-300 disabled:opacity-50"
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
