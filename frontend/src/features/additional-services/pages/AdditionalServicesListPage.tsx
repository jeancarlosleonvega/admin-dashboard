import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageHeader } from '@/hooks/usePageHeader';
import { Plus, Package, Pencil, Trash2 } from 'lucide-react';
import { useAdditionalServices, useDeleteAdditionalService } from '@/hooks/queries/useAdditionalServices';
import PermissionGate from '@components/shared/PermissionGate';
import ConfirmDialog from '@components/shared/ConfirmDialog';
import { Spinner } from '@components/ui/Spinner';
import DataToolbar from '@components/shared/DataToolbar';
import { useColumnVisibility } from '@/hooks/useColumnVisibility';
import type { ColumnDef } from '@/hooks/useColumnVisibility';
import type { AdditionalService } from '@/types/additional-service.types';
import toast from 'react-hot-toast';

const columns: ColumnDef[] = [
  { key: 'name', label: 'Nombre', sortable: false, filterable: true, type: 'text' },
  { key: 'sportType', label: 'Tipo de deporte', sortable: false, filterable: false },
  { key: 'price', label: 'Precio', sortable: false, filterable: false },
  {
    key: 'status', label: 'Estado', sortable: false, filterable: true, type: 'select', options: [
      { label: 'Activo', value: 'true' },
      { label: 'Inactivo', value: 'false' },
    ]
  },
  { key: 'actions', label: 'Acciones', sortable: false, filterable: false },
];

export default function AdditionalServicesListPage() {
  const navigate = useNavigate();

  const headerActions = useMemo(() => (
    <PermissionGate permission="additional-services.manage">
      <button className="btn-primary" onClick={() => navigate('/servicios-adicionales/create')}>
        <Plus className="w-4 h-4 mr-2" />
        Nuevo Servicio
      </button>
    </PermissionGate>
  ), [navigate]);
  usePageHeader({ subtitle: 'Gestionar servicios adicionales', actions: headerActions });

  const [deleteTarget, setDeleteTarget] = useState<AdditionalService | null>(null);

  const { visibleColumns, toggleColumn, resetColumns } = useColumnVisibility('additional-services-columns', columns);

  const { data, isLoading, isError } = useAdditionalServices();
  const deleteService = useDeleteAdditionalService();

  const services = data?.data ?? [];

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteService.mutateAsync(deleteTarget.id);
      toast.success('Servicio eliminado exitosamente');
      setDeleteTarget(null);
    } catch {
      toast.error('Error al eliminar el servicio');
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
      />

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : isError ? (
          <div className="px-6 py-12 text-center text-red-500">
            <p>No se pudieron cargar los servicios adicionales. Por favor, inténtalo de nuevo.</p>
          </div>
        ) : services.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No se encontraron servicios adicionales</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {visibleColumns.includes('name') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                  )}
                  {visibleColumns.includes('sportType') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo de deporte</th>
                  )}
                  {visibleColumns.includes('price') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
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
                {services.map((service) => (
                  <tr key={service.id} className="hover:bg-gray-50">
                    {visibleColumns.includes('name') && (
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{service.name}</p>
                          {service.description && (
                            <p className="text-xs text-gray-500 mt-0.5">{service.description}</p>
                          )}
                        </div>
                      </td>
                    )}
                    {visibleColumns.includes('sportType') && (
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {service.sportType?.name ?? 'General'}
                      </td>
                    )}
                    {visibleColumns.includes('price') && (
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        ${parseFloat(service.price.toString()).toLocaleString('es-AR')}
                      </td>
                    )}
                    {visibleColumns.includes('status') && (
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${service.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                          {service.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                    )}
                    {visibleColumns.includes('actions') && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <PermissionGate permission="additional-services.manage">
                            <button
                              onClick={() => navigate(`/servicios-adicionales/${service.id}/edit`)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50"
                              title="Editar"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          </PermissionGate>
                          <PermissionGate permission="additional-services.manage">
                            <button
                              onClick={() => setDeleteTarget(service)}
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
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Eliminar Servicio Adicional"
        message={`¿Estás seguro de eliminar "${deleteTarget?.name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="danger"
        isLoading={deleteService.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
