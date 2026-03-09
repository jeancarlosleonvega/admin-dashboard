import { useState, useMemo } from 'react';
import { usePageHeader } from '@/hooks/usePageHeader';
import { Plus, UserCheck } from 'lucide-react';
import { useUserMemberships, useCreateUserMembership, useUpdateUserMembership } from '@/hooks/queries/useUserMemberships';
import { Spinner } from '@components/ui/Spinner';
import toast from 'react-hot-toast';
import type { UserMembership } from '@/types/user-membership.types';

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  INACTIVE: 'bg-gray-100 text-gray-700',
  CANCELLED: 'bg-red-100 text-red-700',
  EXPIRED: 'bg-orange-100 text-orange-700',
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Activa',
  INACTIVE: 'Inactiva',
  CANCELLED: 'Cancelada',
  EXPIRED: 'Expirada',
};

function AssignMembershipModal({
  onClose,
  onSave,
  isSaving,
}: {
  onClose: () => void;
  onSave: (data: Record<string, unknown>) => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState({
    userId: '',
    membershipPlanId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      userId: form.userId,
      membershipPlanId: form.membershipPlanId,
      startDate: new Date(form.startDate).toISOString(),
      endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
      notes: form.notes || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Asignar membresía a socio</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ID de Usuario <span className="text-red-500">*</span></label>
            <input type="text" value={form.userId} onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required placeholder="UUID del usuario" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ID de Plan <span className="text-red-500">*</span></label>
            <input type="text" value={form.membershipPlanId} onChange={(e) => setForm((f) => ({ ...f, membershipPlanId: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required placeholder="UUID del plan de membresía" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio <span className="text-red-500">*</span></label>
              <input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin (opcional)</label>
              <input type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <input type="text" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={isSaving} className="btn-primary disabled:opacity-50 flex items-center gap-2">
              {isSaving && <Spinner size="sm" />}
              Asignar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UserMembershipsPage() {
  const [showModal, setShowModal] = useState(false);

  const headerActions = useMemo(() => (
    <button className="btn-primary" onClick={() => setShowModal(true)}>
      <Plus className="w-4 h-4 mr-2" />
      Asignar Membresía
    </button>
  ), []);

  usePageHeader({ subtitle: 'Membresías activas de socios', actions: headerActions });

  const { data, isLoading } = useUserMemberships();
  const createMembership = useCreateUserMembership();
  const updateMembership = useUpdateUserMembership();

  const memberships = data?.data ?? [];

  const handleSave = async (formData: Record<string, unknown>) => {
    try {
      await createMembership.mutateAsync(formData);
      toast.success('Membresía asignada. La membresía anterior fue cancelada automáticamente.');
      setShowModal(false);
    } catch (err: unknown) {
      toast.error(err?.response?.data?.error?.message ?? 'Error al asignar membresía');
    }
  };

  const handleCancel = async (membership: UserMembership) => {
    try {
      await updateMembership.mutateAsync({ id: membership.id, data: { status: 'CANCELLED' } });
      toast.success('Membresía cancelada');
    } catch {
      toast.error('Error al cancelar membresía');
    }
  };

  return (
    <div>
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : memberships.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <UserCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No hay membresías registradas</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Socio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inicio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vencimiento</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reservas mes</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {memberships.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {m.user ? `${m.user.firstName} ${m.user.lastName}` : m.userId}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{m.membershipPlan.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(m.startDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{m.endDate ? new Date(m.endDate).toLocaleDateString() : 'Sin vencimiento'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {m.reservationsUsedMonth}/{m.membershipPlan.monthlyReservationLimit ?? '∞'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${STATUS_BADGE[m.status]}`}>
                        {STATUS_LABEL[m.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {m.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleCancel(m)}
                          disabled={updateMembership.isPending}
                          className="text-xs text-red-600 hover:text-red-800 font-medium"
                        >
                          Cancelar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <AssignMembershipModal
          onClose={() => setShowModal(false)}
          onSave={handleSave}
          isSaving={createMembership.isPending}
        />
      )}
    </div>
  );
}
