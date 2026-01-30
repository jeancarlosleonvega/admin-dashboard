import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { usePermission, useUpdatePermission } from '@/hooks/queries/usePermissions';
import { Spinner } from '@components/ui/Spinner';
import toast from 'react-hot-toast';

const updatePermissionSchema = z.object({
  resource: z.string().min(1, 'Resource is required'),
  action: z.string().min(1, 'Action is required'),
  description: z.string().optional(),
});

type UpdatePermissionFormData = z.infer<typeof updatePermissionSchema>;

export default function PermissionEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: permission, isLoading, isError } = usePermission(id!);
  const updatePermission = useUpdatePermission();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdatePermissionFormData>({
    resolver: zodResolver(updatePermissionSchema),
  });

  useEffect(() => {
    if (permission) {
      reset({
        resource: permission.resource,
        action: permission.action,
        description: permission.description || '',
      });
    }
  }, [permission, reset]);

  const onSubmit = async (data: UpdatePermissionFormData) => {
    if (!id) return;
    try {
      await updatePermission.mutateAsync({
        id,
        data: {
          ...data,
          description: data.description || null,
        },
      });
      toast.success('Permission updated successfully');
      navigate('/permissions');
    } catch (error: any) {
      const message = error.response?.data?.error?.message || 'Failed to update permission';
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

  if (isError || !permission) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Permission not found</p>
        <button onClick={() => navigate('/permissions')} className="mt-4 text-blue-600 hover:underline">
          Back to Permissions
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => navigate('/permissions')}
          className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Permissions
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Edit Permission</h1>
        <p className="text-gray-500">
          Editing {permission.resource}.{permission.action}
        </p>
      </div>

      <div className="card p-6 max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label htmlFor="resource" className="label">
              Resource
            </label>
            <input
              id="resource"
              type="text"
              placeholder="e.g. users, roles, reports"
              className={`input ${errors.resource ? 'input-error' : ''}`}
              {...register('resource')}
            />
            {errors.resource && (
              <p className="mt-1 text-sm text-red-600">{errors.resource.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="action" className="label">
              Action
            </label>
            <input
              id="action"
              type="text"
              placeholder="e.g. view, create, edit, delete"
              className={`input ${errors.action ? 'input-error' : ''}`}
              {...register('action')}
            />
            {errors.action && (
              <p className="mt-1 text-sm text-red-600">{errors.action.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="label">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="description"
              rows={3}
              placeholder="Describe what this permission allows"
              className={`input ${errors.description ? 'input-error' : ''}`}
              {...register('description')}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => navigate('/permissions')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updatePermission.isPending}
              className="btn-primary"
            >
              {updatePermission.isPending ? (
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
