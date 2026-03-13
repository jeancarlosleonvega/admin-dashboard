import { useState, useMemo } from 'react';
import { usePageHeader } from '@/hooks/usePageHeader';
import { Plus, Package, Pencil, Trash2 } from 'lucide-react';
import { useAdditionalServices, useCreateAdditionalService, useUpdateAdditionalService, useDeleteAdditionalService } from '@/hooks/queries/useAdditionalServices';
import { Spinner } from '@components/ui/Spinner';
import ConfirmDialog from '@components/shared/ConfirmDialog';
import toast from 'react-hot-toast';
import type { AdditionalService } from '@/types/additional-service.types';

type ServiceFormData = {
  name: string;
  description?: string;
  price: number;
  active: boolean;
};

function ServiceModal({
  item,
  onClose,
  onSave,
  isSaving,
}: {
  item: AdditionalService | null;
  onClose: () => void;
  onSave: (data: ServiceFormData) => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState({
    name: item?.name ?? '',
    description: item?.description ?? '',
    price: item?.price?.toString() ?? '',
    active: item?.active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: form.name,
      description: form.description || undefined,
      price: parseFloat(form.price),
      active: form.active,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">{item ? 'Editar servicio' : 'Nuevo servicio adicional'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre <span className="text-red-500">*</span></label>
            <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <input type="text" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Precio <span className="text-red-500">*</span></label>
            <input type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} min={0} step={0.01} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="svc-active" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} className="rounded border-gray-300 text-blue-600" />
            <label htmlFor="svc-active" className="text-sm text-gray-700">Activo</label>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={isSaving} className="btn-primary disabled:opacity-50 flex items-center gap-2">
              {isSaving && <Spinner size="sm" />}
              {item ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdditionalServicesPage() {
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<AdditionalService | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdditionalService | null>(null);

  const headerActions = useMemo(() => (
    <button className="btn-primary" onClick={() => { setEditTarget(null); setShowModal(true); }}>
      <Plus className="w-4 h-4 mr-2" />
      Nuevo Servicio
    </button>
  ), []);

  usePageHeader({ subtitle: 'Gestionar servicios adicionales', actions: headerActions });

  const { data, isLoading } = useAdditionalServices();
  const createService = useCreateAdditionalService();
  const updateService = useUpdateAdditionalService();
  const deleteService = useDeleteAdditionalService();

  const services = data?.data ?? [];

  const handleSave = async (formData: ServiceFormData) => {
    try {
      if (editTarget) {
        await updateService.mutateAsync({ id: editTarget.id, data: formData });
        toast.success('Servicio actualizado');
      } else {
        await createService.mutateAsync(formData);
        toast.success('Servicio creado');
      }
      setShowModal(false);
      setEditTarget(null);
    } catch {
      toast.error('Error al guardar servicio');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteService.mutateAsync(deleteTarget.id);
      toast.success('Servicio eliminado');
      setDeleteTarget(null);
    } catch {
      toast.error('Error al eliminar servicio');
    }
  };

  return (
    <div>
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : services.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No hay servicios adicionales</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo de Deporte</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {services.map((service) => (
                  <tr key={service.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{service.name}</p>
                        {service.description && <p className="text-xs text-gray-500">{service.description}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{service.sportType?.name ?? 'General'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">${parseFloat(service.price.toString()).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${service.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {service.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => { setEditTarget(service); setShowModal(true); }} className="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteTarget(service)} className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <ServiceModal
          item={editTarget}
          onClose={() => { setShowModal(false); setEditTarget(null); }}
          onSave={handleSave}
          isSaving={createService.isPending || updateService.isPending}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Eliminar Servicio"
        message={`¿Estás seguro de eliminar "${deleteTarget?.name}"?`}
        confirmLabel="Eliminar"
        variant="danger"
        isLoading={deleteService.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
