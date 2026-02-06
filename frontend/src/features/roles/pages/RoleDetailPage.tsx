import { useEffect, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Shield, Lock, AlertTriangle } from 'lucide-react';
import { useRole, useUpdateRole } from '@/hooks/queries/useRoles';
import { useAllPermissions } from '@/hooks/queries/usePermissions';
import { useAuthStore } from '@stores/authStore';
import { Spinner } from '@components/ui/Spinner';
import { Tabs, TabPanel } from '@components/ui/Tabs';
import { DetailSection } from '@components/ui/DetailSection';
import type { TabDef } from '@components/ui/Tabs';
import toast from 'react-hot-toast';

const tabs: TabDef[] = [
  { id: 'general', label: 'General', icon: Shield },
  { id: 'permissions', label: 'Permissions', icon: Lock },
];

const updateRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required').max(50),
  description: z.string().max(200).optional().or(z.literal('')),
  permissionIds: z.array(z.string()).optional(),
});

type UpdateRoleFormData = z.infer<typeof updateRoleSchema>;

export default function RoleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'general';
  const { can } = useAuthStore();
  const canManage = can('roles.manage');

  const { data: role, isLoading, isError } = useRole(id!);
  const { data: permissions, isLoading: permissionsLoading } = useAllPermissions();
  const updateRole = useUpdateRole();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateRoleFormData>({
    resolver: zodResolver(updateRoleSchema),
  });

  useEffect(() => {
    if (role) {
      reset({
        name: role.name,
        description: role.description || '',
        permissionIds: role.permissions.map((p) => p.id),
      });
    }
  }, [role, reset]);

  const groupedPermissions = useMemo(() => {
    if (!permissions) return {};
    return permissions.reduce<Record<string, typeof permissions>>((groups, permission) => {
      const resource = permission.resource;
      if (!groups[resource]) groups[resource] = [];
      groups[resource].push(permission);
      return groups;
    }, {});
  }, [permissions]);

  const handleTabChange = (tabId: string) => {
    setSearchParams({ tab: tabId }, { replace: true });
  };

  const onSubmit = async (data: UpdateRoleFormData) => {
    if (!id) return;
    try {
      const permissionIds = data.permissionIds?.filter(Boolean);
      await updateRole.mutateAsync({
        id,
        data: {
          name: role?.isSystem ? undefined : data.name,
          description: data.description || null,
          permissionIds: permissionIds && permissionIds.length > 0 ? permissionIds : undefined,
        },
      });
      toast.success('Role updated successfully');
    } catch (error: any) {
      const message = error.response?.data?.error?.message || 'Failed to update role';
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

  if (isError || !role) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Role not found</p>
        <button onClick={() => navigate('/roles')} className="mt-4 text-blue-600 hover:underline">
          Back to Roles
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => navigate('/roles')}
        className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Roles
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{role.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            {role.description && <span className="text-sm text-gray-500">{role.description}</span>}
            {role.isSystem && (
              <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-700">System</span>
            )}
            <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded bg-blue-50 text-blue-700">
              {role.permissions.length} permission{role.permissions.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {role.isSystem && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
          <p className="text-sm text-yellow-700">This is a system role. Some fields may be restricted.</p>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 pt-4">
          <Tabs tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />
        </div>
        <div className="px-6 pb-6">
          <TabPanel id="general" activeTab={activeTab}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <DetailSection title="Role Info" description="Name and description of this role.">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="label">Role Name</label>
                    <input id="name" type="text" className={`input ${errors.name ? 'input-error' : ''}`} disabled={role.isSystem || !canManage} {...register('name')} />
                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="description" className="label">Description</label>
                    <textarea id="description" rows={3} className={`input ${errors.description ? 'input-error' : ''}`} placeholder="Optional description" readOnly={!canManage} {...register('description')} />
                    {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
                  </div>
                </div>
              </DetailSection>

              <DetailSection title="Metadata" description="System information." noBorder>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Created At</label>
                    <input type="text" className="input bg-gray-50" value={new Date(role.createdAt).toLocaleString()} readOnly />
                  </div>
                  <div>
                    <label className="label">Updated At</label>
                    <input type="text" className="input bg-gray-50" value={new Date(role.updatedAt).toLocaleString()} readOnly />
                  </div>
                </div>
                {canManage && isDirty && (
                  <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
                    <button type="submit" disabled={updateRole.isPending} className="btn-primary">
                      {updateRole.isPending ? <Spinner size="sm" className="text-white" /> : 'Save Changes'}
                    </button>
                  </div>
                )}
              </DetailSection>
            </form>
          </TabPanel>

          <TabPanel id="permissions" activeTab={activeTab}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <DetailSection title="Assigned Permissions" description="Select which permissions this role grants." noBorder>
                {permissionsLoading ? (
                  <Spinner size="sm" />
                ) : Object.keys(groupedPermissions).length === 0 ? (
                  <p className="text-sm text-gray-500">No permissions available</p>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(groupedPermissions)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([resource, perms]) => (
                        <div key={resource} className="border border-gray-200 rounded-lg p-4">
                          <h4 className="text-sm font-semibold text-gray-700 capitalize mb-2">{resource}</h4>
                          <div className="space-y-2">
                            {perms.map((permission) => (
                              <label key={permission.id} className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  value={permission.id}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  disabled={!canManage}
                                  {...register('permissionIds')}
                                />
                                <span className="text-sm text-gray-700">{permission.action}</span>
                                {permission.description && <span className="text-xs text-gray-400">- {permission.description}</span>}
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
                {canManage && isDirty && (
                  <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
                    <button type="submit" disabled={updateRole.isPending} className="btn-primary">
                      {updateRole.isPending ? <Spinner size="sm" className="text-white" /> : 'Save Changes'}
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
