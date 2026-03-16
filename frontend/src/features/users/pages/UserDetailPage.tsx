import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { usePageHeader } from '@/hooks/usePageHeader';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, User, Shield, Ban } from 'lucide-react';
import { useUser, useUpdateUser } from '@/hooks/queries/useUsers';
import { useRolesList } from '@/hooks/queries/useRoles';
import { useAuthStore } from '@stores/authStore';
import { Spinner } from '@components/ui/Spinner';
import { Tabs, TabPanel } from '@components/ui/Tabs';
import { DetailSection } from '@components/ui/DetailSection';
import type { TabDef } from '@components/ui/Tabs';
import { UserStatus } from '@/types/user.types';
import toast from 'react-hot-toast';
import { formatDateTime } from '@lib/formatDate';
import { useUserSuspensions, useCreateSuspension, useLiftSuspension } from '@/hooks/queries/useSuspensions';
import { useBookings } from '@/hooks/queries/useBookings';

function NoShowCount({ userId }: { userId: string }) {
  const { data } = useBookings({ userId, status: 'NO_SHOW', limit: 100 });
  const count = data?.meta.total ?? 0;
  return (
    <p className="text-sm text-gray-600">
      <span className="font-semibold text-orange-600">{count}</span> ausencia{count !== 1 ? 's' : ''} registrada{count !== 1 ? 's' : ''}
    </p>
  );
}

const tabs: TabDef[] = [
  { id: 'general', label: 'General', icon: User },
  { id: 'roles', label: 'Roles', icon: Shield },
  { id: 'suspensions', label: 'Suspensiones', icon: Ban },
];

const updateUserSchema = z.object({
  email: z.string().email('Email inválido'),
  firstName: z.string().min(1, 'El nombre es obligatorio').max(50),
  lastName: z.string().min(1, 'El apellido es obligatorio').max(50),
  status: z.nativeEnum(UserStatus),
  roleIds: z.array(z.string()).optional(),
});

type UpdateUserFormData = z.infer<typeof updateUserSchema>;

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'general';
  const { can } = useAuthStore();
  const canEdit = can('users.edit');

  const { data: user, isLoading, isError } = useUser(id!);
  const { data: roles, isLoading: rolesLoading } = useRolesList();
  const updateUser = useUpdateUser();
  usePageHeader({});

  const { data: suspensions = [], isLoading: suspensionsLoading } = useUserSuspensions(id!);
  const createSuspension = useCreateSuspension();
  const liftSuspension = useLiftSuspension(id!);

  const [showSuspendForm, setShowSuspendForm] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendStart, setSuspendStart] = useState(new Date().toISOString().split('T')[0]);
  const [suspendEnd, setSuspendEnd] = useState('');

  const activeSuspension = suspensions.find(
    (s) => !s.liftedAt && (!s.endDate || new Date(s.endDate) > new Date())
  );

  const handleCreateSuspension = async () => {
    if (!id || !suspendReason) return;
    try {
      await createSuspension.mutateAsync({
        userId: id,
        reason: suspendReason,
        startDate: suspendStart,
        endDate: suspendEnd || undefined,
      });
      toast.success('Suspensión creada');
      setShowSuspendForm(false);
      setSuspendReason('');
      setSuspendEnd('');
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message ?? 'Error al suspender');
    }
  };

  const handleLiftSuspension = async (suspId: string) => {
    try {
      await liftSuspension.mutateAsync(suspId);
      toast.success('Suspensión levantada');
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message ?? 'Error al levantar suspensión');
    }
  };

  const suspensionStatus = (s: { liftedAt: string | null; endDate: string | null }) => {
    if (s.liftedAt) return { label: 'Levantada', cls: 'text-gray-500 bg-gray-100' };
    if (s.endDate && new Date(s.endDate) <= new Date()) return { label: 'Vencida', cls: 'text-yellow-700 bg-yellow-100' };
    return { label: 'Activa', cls: 'text-red-700 bg-red-100' };
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateUserFormData>({
    resolver: zodResolver(updateUserSchema),
  });

  useEffect(() => {
    if (user) {
      reset({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.status,
        roleIds: user.roles.map((r) => r.id),
      });
    }
  }, [user, reset]);

  const handleTabChange = (tabId: string) => {
    setSearchParams({ tab: tabId }, { replace: true });
  };

  const onSubmit = async (data: UpdateUserFormData) => {
    if (!id) return;
    try {
      const roleIds = data.roleIds?.filter(Boolean);
      await updateUser.mutateAsync({
        id,
        data: {
          ...data,
          roleIds: roleIds && roleIds.length > 0 ? roleIds : undefined,
        },
      });
      toast.success('Usuario actualizado exitosamente');
    } catch (error) {
      const message = (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Error al actualizar el usuario';
      toast.error(message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Usuario no encontrado</p>
        <button onClick={() => navigate('/usuarios')} className="mt-4 text-blue-600 hover:underline">
          Volver a Usuarios
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => navigate('/usuarios')}
        className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Volver a Usuarios
      </button>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 pt-4">
          <Tabs tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />
        </div>
        <div className="px-6 pb-6">
          <TabPanel id="general" activeTab={activeTab}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <DetailSection title="Información de cuenta" description="Datos básicos de la cuenta.">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="label">Nombre</label>
                    <input id="firstName" type="text" className={`input ${errors.firstName ? 'input-error' : ''}`} readOnly={!canEdit} {...register('firstName')} />
                    {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="lastName" className="label">Apellido</label>
                    <input id="lastName" type="text" className={`input ${errors.lastName ? 'input-error' : ''}`} readOnly={!canEdit} {...register('lastName')} />
                    {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>}
                  </div>
                </div>
              </DetailSection>

              <DetailSection title="Email y Estado" description="Email de acceso y estado de la cuenta.">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="email" className="label">Email</label>
                    <input id="email" type="email" className={`input ${errors.email ? 'input-error' : ''}`} readOnly={!canEdit} {...register('email')} />
                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="status" className="label">Estado</label>
                    <select id="status" className={`input ${errors.status ? 'input-error' : ''}`} disabled={!canEdit} {...register('status')}>
                      <option value="ACTIVE">Activo</option>
                      <option value="INACTIVE">Inactivo</option>
                      <option value="SUSPENDED">Suspendido</option>
                    </select>
                    {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>}
                  </div>
                </div>
              </DetailSection>

              <DetailSection title="Datos del sistema" description="Información del sistema." noBorder>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Creado el</label>
                    <input type="text" className="input bg-gray-50" value={formatDateTime(user.createdAt)} readOnly />
                  </div>
                  <div>
                    <label className="label">Actualizado el</label>
                    <input type="text" className="input bg-gray-50" value={formatDateTime(user.updatedAt)} readOnly />
                  </div>
                </div>
                {canEdit && isDirty && (
                  <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
                    <button type="submit" disabled={updateUser.isPending} className="btn-primary">
                      {updateUser.isPending ? <Spinner size="sm" className="text-white" /> : 'Guardar cambios'}
                    </button>
                  </div>
                )}
              </DetailSection>
            </form>
          </TabPanel>

          <TabPanel id="roles" activeTab={activeTab}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <DetailSection title="Roles asignados" description="Los roles determinan los permisos del usuario." noBorder>
                {rolesLoading ? (
                  <Spinner size="sm" />
                ) : (
                  <div className="space-y-2">
                    {roles?.map((role) => (
                      <label key={role.id} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50">
                        <input
                          type="checkbox"
                          value={role.id}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          disabled={!canEdit}
                          {...register('roleIds')}
                        />
                        <span className="text-sm text-gray-700 font-medium">{role.name}</span>
                        {role.description && <span className="text-xs text-gray-400">- {role.description}</span>}
                      </label>
                    ))}
                  </div>
                )}
                {canEdit && isDirty && (
                  <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
                    <button type="submit" disabled={updateUser.isPending} className="btn-primary">
                      {updateUser.isPending ? <Spinner size="sm" className="text-white" /> : 'Guardar cambios'}
                    </button>
                  </div>
                )}
              </DetailSection>
            </form>
          </TabPanel>

          <TabPanel id="suspensions" activeTab={activeTab}>
            <DetailSection title="Control de suspensiones" description="Historial de suspensiones del usuario." noBorder>
              {suspensionsLoading ? (
                <Spinner size="sm" />
              ) : (
                <div className="space-y-4">
                  {/* Conteo de ausencias */}
                  <NoShowCount userId={id!} />

                  {/* Botón suspender */}
                  {canEdit && !activeSuspension && !showSuspendForm && (
                    <button
                      onClick={() => setShowSuspendForm(true)}
                      className="flex items-center gap-2 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      <Ban className="w-4 h-4" />
                      Suspender usuario
                    </button>
                  )}

                  {/* Formulario de suspensión */}
                  {showSuspendForm && (
                    <div className="border border-red-200 rounded-lg p-4 bg-red-50 space-y-3">
                      <p className="text-sm font-medium text-red-800">Nueva suspensión</p>
                      <div>
                        <label className="label">Motivo <span className="text-red-500">*</span></label>
                        <textarea
                          value={suspendReason}
                          onChange={(e) => setSuspendReason(e.target.value)}
                          rows={2}
                          className="input resize-none"
                          placeholder="Motivo de la suspensión…"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="label">Desde</label>
                          <input type="date" value={suspendStart} onChange={(e) => setSuspendStart(e.target.value)} className="input" />
                        </div>
                        <div>
                          <label className="label">Hasta (opcional)</label>
                          <input type="date" value={suspendEnd} onChange={(e) => setSuspendEnd(e.target.value)} className="input" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setShowSuspendForm(false)} className="flex-1 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                          Cancelar
                        </button>
                        <button
                          onClick={handleCreateSuspension}
                          disabled={!suspendReason || createSuspension.isPending}
                          className="flex-1 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                        >
                          {createSuspension.isPending ? 'Guardando…' : 'Confirmar'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Tabla de suspensiones */}
                  {suspensions.length === 0 ? (
                    <p className="text-sm text-gray-400 py-4 text-center">Sin suspensiones registradas</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Motivo</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Desde</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Hasta</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                            {canEdit && <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {suspensions.map((s) => {
                            const st = suspensionStatus(s);
                            const isActive = !s.liftedAt && (!s.endDate || new Date(s.endDate) > new Date());
                            return (
                              <tr key={s.id} className="hover:bg-gray-50">
                                <td className="px-3 py-2 text-gray-700 max-w-[180px] truncate" title={s.reason}>{s.reason}</td>
                                <td className="px-3 py-2 text-gray-500">{new Date(s.startDate).toLocaleDateString('es-AR')}</td>
                                <td className="px-3 py-2 text-gray-500">{s.endDate ? new Date(s.endDate).toLocaleDateString('es-AR') : '—'}</td>
                                <td className="px-3 py-2">
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.isAutomatic ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {s.isAutomatic ? 'Auto' : 'Manual'}
                                  </span>
                                </td>
                                <td className="px-3 py-2">
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.cls}`}>{st.label}</span>
                                </td>
                                {canEdit && (
                                  <td className="px-3 py-2 text-right">
                                    {isActive && (
                                      <button
                                        onClick={() => handleLiftSuspension(s.id)}
                                        disabled={liftSuspension.isPending}
                                        className="text-xs text-blue-600 hover:underline disabled:opacity-50"
                                      >
                                        Levantar
                                      </button>
                                    )}
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </DetailSection>
          </TabPanel>
        </div>
      </div>
    </div>
  );
}
