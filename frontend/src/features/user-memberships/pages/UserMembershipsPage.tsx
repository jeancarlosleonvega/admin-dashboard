import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageHeader } from '@/hooks/usePageHeader';
import { Plus, UserCheck } from 'lucide-react';
import { useUserMemberships, useUpdateUserMembership } from '@/hooks/queries/useUserMemberships';
import PermissionGate from '@components/shared/PermissionGate';
import ConfirmDialog from '@components/shared/ConfirmDialog';
import { Spinner } from '@components/ui/Spinner';
import DataToolbar from '@components/shared/DataToolbar';
import { useColumnVisibility } from '@/hooks/useColumnVisibility';
import type { ColumnDef } from '@/hooks/useColumnVisibility';
import type { UserMembership } from '@/types/user-membership.types';
import toast from 'react-hot-toast';

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

const columns: ColumnDef[] = [
  { key: 'user', label: 'Socio', sortable: false, filterable: false },
  { key: 'plan', label: 'Plan', sortable: false, filterable: false },
  { key: 'startDate', label: 'Inicio', sortable: false, filterable: false },
  { key: 'endDate', label: 'Vencimiento', sortable: false, filterable: false },
  { key: 'reservations', label: 'Reservas mes', sortable: false, filterable: false },
  {
    key: 'status', label: 'Estado', sortable: false, filterable: true, type: 'select', options: [
      { label: 'Activa', value: 'ACTIVE' },
      { label: 'Inactiva', value: 'INACTIVE' },
      { label: 'Cancelada', value: 'CANCELLED' },
      { label: 'Expirada', value: 'EXPIRED' },
    ]
  },
  { key: 'actions', label: 'Acciones', sortable: false, filterable: false },
];

export default function UserMembershipsPage() {
  const navigate = useNavigate();

  const headerActions = useMemo(() => (
    <PermissionGate permission="user-memberships.manage">
      <button className="btn-primary" onClick={() => navigate('/user-memberships/create')}>
        <Plus className="w-4 h-4 mr-2" />
        Asignar Membresía
      </button>
    </PermissionGate>
  ), [navigate]);
  usePageHeader({ subtitle: 'Membresías activas de socios', actions: headerActions });

  const [cancelTarget, setCancelTarget] = useState<UserMembership | null>(null);

  const { visibleColumns, toggleColumn, resetColumns } = useColumnVisibility('user-memberships-columns', columns);

  const { data, isLoading, isError } = useUserMemberships();
  const updateMembership = useUpdateUserMembership();

  const memberships = data?.data ?? [];

  const handleCancel = async () => {
    if (!cancelTarget) return;
    try {
      await updateMembership.mutateAsync({ id: cancelTarget.id, data: { status: 'CANCELLED' } });
      toast.success('Membresía cancelada exitosamente');
      setCancelTarget(null);
    } catch {
      toast.error('Error al cancelar la membresía');
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
            <p>No se pudieron cargar las membresías. Por favor, inténtalo de nuevo.</p>
          </div>
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
                  {visibleColumns.includes('user') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Socio</th>
                  )}
                  {visibleColumns.includes('plan') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                  )}
                  {visibleColumns.includes('startDate') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inicio</th>
                  )}
                  {visibleColumns.includes('endDate') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimiento</th>
                  )}
                  {visibleColumns.includes('reservations') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reservas mes</th>
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
                {memberships.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    {visibleColumns.includes('user') && (
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {m.user ? `${m.user.firstName} ${m.user.lastName}` : m.userId}
                        {m.user && (
                          <p className="text-xs text-gray-500 mt-0.5">{m.user.email}</p>
                        )}
                      </td>
                    )}
                    {visibleColumns.includes('plan') && (
                      <td className="px-6 py-4 text-sm text-gray-500">{m.membershipPlan.name}</td>
                    )}
                    {visibleColumns.includes('startDate') && (
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(m.startDate).toLocaleDateString('es-AR')}
                      </td>
                    )}
                    {visibleColumns.includes('endDate') && (
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {m.endDate ? new Date(m.endDate).toLocaleDateString('es-AR') : 'Sin vencimiento'}
                      </td>
                    )}
                    {visibleColumns.includes('reservations') && (
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {m.reservationsUsedMonth}/{m.membershipPlan.monthlyReservationLimit ?? '∞'}
                      </td>
                    )}
                    {visibleColumns.includes('status') && (
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${STATUS_BADGE[m.status]}`}>
                          {STATUS_LABEL[m.status]}
                        </span>
                      </td>
                    )}
                    {visibleColumns.includes('actions') && (
                      <td className="px-6 py-4 text-right">
                        {m.status === 'ACTIVE' && (
                          <PermissionGate permission="user-memberships.manage">
                            <button
                              onClick={() => setCancelTarget(m)}
                              className="text-xs text-red-600 hover:text-red-800 font-medium"
                            >
                              Cancelar
                            </button>
                          </PermissionGate>
                        )}
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
        isOpen={!!cancelTarget}
        title="Cancelar Membresía"
        message={`¿Estás seguro de cancelar la membresía de ${cancelTarget?.user ? `${cancelTarget.user.firstName} ${cancelTarget.user.lastName}` : 'este socio'}?`}
        confirmLabel="Cancelar membresía"
        variant="danger"
        isLoading={updateMembership.isPending}
        onConfirm={handleCancel}
        onCancel={() => setCancelTarget(null)}
      />
    </div>
  );
}
