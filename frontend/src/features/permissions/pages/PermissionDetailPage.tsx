import { useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Lock } from 'lucide-react';
import { usePermission, useUpdatePermission } from '@/hooks/queries/usePermissions';
import { useAuthStore } from '@stores/authStore';
import { Spinner } from '@components/ui/Spinner';
import { Tabs, TabPanel } from '@components/ui/Tabs';
import { DetailSection } from '@components/ui/DetailSection';
import type { TabDef } from '@components/ui/Tabs';
import toast from 'react-hot-toast';

const tabs: TabDef[] = [
  { id: 'general', label: 'General', icon: Lock },
];

const updatePermissionSchema = z.object({
  resource: z.string().min(1, 'Resource is required'),
  action: z.string().min(1, 'Action is required'),
  description: z.string().optional(),
});

type UpdatePermissionFormData = z.infer<typeof updatePermissionSchema>;

export default function PermissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'general';
  const { can } = useAuthStore();
  const canManage = can('roles.manage');

  const { data: permission, isLoading, isError } = usePermission(id!);
  const updatePermission = useUpdatePermission();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
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

  const handleTabChange = (tabId: string) => {
    setSearchParams({ tab: tabId }, { replace: true });
  };

  const onSubmit = async (data: UpdatePermissionFormData) => {
    if (!id) return;
    try {
      await updatePermission.mutateAsync({
        id,
        data: { ...data, description: data.description || null },
      });
      toast.success('Permission updated successfully');
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
      <button
        onClick={() => navigate('/permissions')}
        className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Permissions
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {permission.resource}.{permission.action}
          </h1>
          {permission.description && (
            <p className="text-sm text-gray-500 mt-1">{permission.description}</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 pt-4">
          <Tabs tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />
        </div>
        <div className="px-6 pb-6">
          <TabPanel id="general" activeTab={activeTab}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <DetailSection title="Permission Definition" description="The resource and action this permission grants access to.">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="resource" className="label">Resource</label>
                    <input id="resource" type="text" placeholder="e.g. users, roles" className={`input ${errors.resource ? 'input-error' : ''}`} readOnly={!canManage} {...register('resource')} />
                    {errors.resource && <p className="mt-1 text-sm text-red-600">{errors.resource.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="action" className="label">Action</label>
                    <input id="action" type="text" placeholder="e.g. view, create, edit" className={`input ${errors.action ? 'input-error' : ''}`} readOnly={!canManage} {...register('action')} />
                    {errors.action && <p className="mt-1 text-sm text-red-600">{errors.action.message}</p>}
                  </div>
                </div>
              </DetailSection>

              <DetailSection title="Description" description="A human-readable description of this permission." noBorder>
                <div>
                  <textarea
                    id="description"
                    rows={3}
                    placeholder="Describe what this permission allows"
                    className={`input ${errors.description ? 'input-error' : ''}`}
                    readOnly={!canManage}
                    {...register('description')}
                  />
                  {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
                </div>
                {canManage && isDirty && (
                  <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
                    <button type="submit" disabled={updatePermission.isPending} className="btn-primary">
                      {updatePermission.isPending ? <Spinner size="sm" className="text-white" /> : 'Save Changes'}
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
