import { useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { usePageHeader } from '@/hooks/usePageHeader';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, User, Shield } from 'lucide-react';
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

const tabs: TabDef[] = [
  { id: 'general', label: 'General', icon: User },
  { id: 'roles', label: 'Roles', icon: Shield },
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
        </div>
      </div>
    </div>
  );
}
