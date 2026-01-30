import { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { useRole, useUpdateRole } from '@/hooks/queries/useRoles';
import { useAllPermissions } from '@/hooks/queries/usePermissions';
import { Spinner } from '@components/ui/Spinner';
import toast from 'react-hot-toast';

const updateRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required').max(50, 'Role name must be at most 50 characters'),
  description: z.string().max(200).optional().or(z.literal('')),
  permissionIds: z.array(z.string()).optional(),
});

type UpdateRoleFormData = z.infer<typeof updateRoleSchema>;

export default function RoleEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: role, isLoading, isError } = useRole(id!);
  const { data: permissions, isLoading: permissionsLoading } = useAllPermissions();
  const updateRole = useUpdateRole();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
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
      if (!groups[resource]) {
        groups[resource] = [];
      }
      groups[resource].push(permission);
      return groups;
    }, {});
  }, [permissions]);

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
      navigate('/roles');
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
      <div className="mb-6">
        <button
          onClick={() => navigate('/roles')}
          className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Roles
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Edit Role</h1>
        <p className="text-gray-500">Editing {role.name}</p>
      </div>

      {role.isSystem && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
          <p className="text-sm text-yellow-700">
            This is a system role. Some fields may be restricted.
          </p>
        </div>
      )}

      <div className="card p-6 max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label htmlFor="name" className="label">
              Role Name
            </label>
            <input
              id="name"
              type="text"
              className={`input ${errors.name ? 'input-error' : ''}`}
              disabled={role.isSystem}
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

          <div>
            <label className="label">Permissions</label>
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
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => navigate('/roles')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateRole.isPending}
              className="btn-primary"
            >
              {updateRole.isPending ? (
                <Spinner size="sm" className="text-white" />
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
