import { useState, useMemo } from 'react';
import { usePageHeader } from '@/hooks/usePageHeader';
import { Plus, Ban, Pencil, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blockedPeriodsApi, type BlockedPeriod } from '@api/blockedPeriods.api';
import { Spinner } from '@components/ui/Spinner';
import ConfirmDialog from '@components/shared/ConfirmDialog';
import toast from 'react-hot-toast';

function BlockedPeriodModal({
  item,
  onClose,
  onSave,
  isSaving,
}: {
  item: BlockedPeriod | null;
  onClose: () => void;
  onSave: (data: Record<string, unknown>) => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState({
    reason: item?.reason ?? '',
    startDate: item?.startDate ? item.startDate.split('T')[0] : '',
    endDate: item?.endDate ? item.endDate.split('T')[0] : '',
    startTime: item?.startTime ?? '',
    endTime: item?.endTime ?? '',
    active: item?.active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      reason: form.reason || undefined,
      startDate: new Date(form.startDate).toISOString(),
      endDate: new Date(form.endDate).toISOString(),
      startTime: form.startTime || null,
      endTime: form.endTime || null,
      active: form.active,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg">
        <h2 className="text-lg font-semibold mb-4">{item ? 'Editar período bloqueado' : 'Nuevo período bloqueado'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
            <input
              type="text"
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Ej: Mantenimiento, Feriado..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Desde <span className="text-red-500">*</span></label>
              <input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hasta <span className="text-red-500">*</span></label>
              <input type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora inicio (opcional)</label>
              <input type="time" value={form.startTime} onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora fin (opcional)</label>
              <input type="time" value={form.endTime} onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="modal-active" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} className="rounded border-gray-300 text-blue-600" />
            <label htmlFor="modal-active" className="text-sm text-gray-700">Activo</label>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={isSaving} className="btn-primary disabled:opacity-50 flex items-center gap-2">
              {isSaving && <Spinner size="sm" />}
              {item ? 'Guardar cambios' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function BlockedPeriodsPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<BlockedPeriod | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BlockedPeriod | null>(null);

  const headerActions = useMemo(() => (
    <button className="btn-primary" onClick={() => { setEditTarget(null); setShowModal(true); }}>
      <Plus className="w-4 h-4 mr-2" />
      Nuevo Período
    </button>
  ), []);

  usePageHeader({ subtitle: 'Bloquear días o franjas horarias', actions: headerActions });

  const { data, isLoading } = useQuery({
    queryKey: ['blocked-periods'],
    queryFn: () => blockedPeriodsApi.getBlockedPeriods(),
  });

  const createMutation = useMutation({
    mutationFn: (d: Record<string, unknown>) => blockedPeriodsApi.createBlockedPeriod(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['blocked-periods'] }); toast.success('Período bloqueado creado'); setShowModal(false); },
    onError: () => toast.error('Error al crear período bloqueado'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => blockedPeriodsApi.updateBlockedPeriod(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['blocked-periods'] }); toast.success('Período bloqueado actualizado'); setShowModal(false); setEditTarget(null); },
    onError: () => toast.error('Error al actualizar'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => blockedPeriodsApi.deleteBlockedPeriod(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['blocked-periods'] }); toast.success('Período bloqueado eliminado'); setDeleteTarget(null); },
    onError: () => toast.error('Error al eliminar'),
  });

  const periods = data?.data ?? [];

  return (
    <div>
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : periods.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <Ban className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No hay períodos bloqueados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motivo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Desde</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hasta</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Franja horaria</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aplica a</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {periods.map((period) => (
                  <tr key={period.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{period.reason ?? '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(period.startDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(period.endDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {period.startTime && period.endTime ? `${period.startTime} - ${period.endTime}` : 'Todo el día'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {period.venue ? `Venue: ${period.venue.name}` : period.sportType ? `Deporte: ${period.sportType.name}` : 'Global'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${period.active ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                        {period.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => { setEditTarget(period); setShowModal(true); }} className="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteTarget(period)} className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50">
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
        <BlockedPeriodModal
          item={editTarget}
          onClose={() => { setShowModal(false); setEditTarget(null); }}
          onSave={(d) => {
            if (editTarget) updateMutation.mutate({ id: editTarget.id, data: d });
            else createMutation.mutate(d);
          }}
          isSaving={createMutation.isPending || updateMutation.isPending}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Eliminar Período Bloqueado"
        message="¿Estás seguro? Los slots bloqueados por este período volverán a estar disponibles."
        confirmLabel="Eliminar"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
