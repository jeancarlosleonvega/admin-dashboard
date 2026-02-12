import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Tag, Lock } from 'lucide-react';
import { useCreateRole } from '@/hooks/queries/useRoles';
import { useAllPermissions } from '@/hooks/queries/usePermissions';
import { Spinner } from '@components/ui/Spinner';
import { Tabs } from '@components/ui/Tabs';
import type { TabDef } from '@components/ui/Tabs';
import { DetailSection } from '@components/ui/DetailSection';
import toast from 'react-hot-toast';

const createRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required').max(50, 'Role name must be at most 50 characters'),
  description: z.string().max(200).optional().or(z.literal('')),
  permissionIds: z.array(z.string()).optional(),
});

type CreateRoleFormData = z.infer<typeof createRoleSchema>;

const tabs: TabDef[] = [
  { id: 'general', label: 'General', icon: Tag },
  { id: 'permissions', label: 'Permissions', icon: Lock },
];

export default function RoleCreatePage() {
  const navigate = useNavigate();
  const createRole = useCreateRole();
  const { data: permissions, isLoading: permissionsLoading } = useAllPermissions();
  const [activeTab, setActiveTab] = useState('general');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateRoleFormData>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: { permissionIds: [] },
  });

  const groupedPermissions = useMemo(() => {
    if (!permissions) return {};
    return permissions.reduce<Record<string, typeof permissions>>((groups, permission) => {
      const resource = permission.resource;
      if (!groups[resource]) {
        groups[resource] = [];
      }
      groups[resource].push(permission);
      return groups;
    }, {});
  }, [permissions]);

  const onSubmit = async (data: CreateRoleFormData) => {
    try {
      const permissionIds = data.permissionIds?.filter(Boolean);
      await createRole.mutateAsync({
        name: data.name,
        description: data.description || undefined,
        permissionIds: permissionIds && permissionIds.length > 0 ? permissionIds : undefined,
      });
      toast.success('Role created successfully');
      navigate('/roles');
    } catch (error: any) {
      const message = error.response?.data?.error?.message || 'Failed to create role';
      toast.error(message);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => navigate('/roles')}
          className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Roles
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Create Role</h1>
        <p className="text-gray-500">Add a new role to the system</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 pt-4">
          <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="px-6">
            {/* Tab: General */}
            <div className={activeTab === 'general' ? '' : 'hidden'}>
              <DetailSection title="Role Information" description="Name and description for this role" noBorder>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="label">
                      Role Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      className={`input ${errors.name ? 'input-error' : ''}`}
                      {...register('name')}
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="description" className="label">
                      Description
                    </label>
                    <textarea
                      id="description"
                      rows={3}
                      className={`input ${errors.description ? 'input-error' : ''}`}
                      placeholder="Optional description for this role"
                      {...register('description')}
                    />
                    {errors.description && (
                      <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                    )}
                  </div>
                </div>
              </DetailSection>
            </div>

            {/* Tab: Permissions */}
            <div className={activeTab === 'permissions' ? '' : 'hidden'}>
              <DetailSection title="Permissions" description="Select permissions for this role" noBorder>
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
                          <h4 className="text-sm font-semibold text-gray-700 capitalize mb-2">
                            {resource}
                          </h4>
                          <div className="space-y-2">
                            {perms.map((permission) => (
                              <label key={permission.id} className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  value={permission.id}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  {...register('permissionIds')}
                                />
                                <span className="text-sm text-gray-700">{permission.action}</span>
                                {permission.description && (
                                  <span className="text-xs text-gray-400">- {permission.description}</span>
                                )}
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </DetailSection>
            </div>
          </div>

          <div className="px-6 pb-6 flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/roles')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createRole.isPending}
              className="btn-primary"
            >
              {createRole.isPending ? (
                <Spinner size="sm" className="text-white" />
              ) : (
                'Create Role'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
