import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Key, FileText } from 'lucide-react';
import { useCreatePermission } from '@/hooks/queries/usePermissions';
import { Spinner } from '@components/ui/Spinner';
import { Tabs } from '@components/ui/Tabs';
import type { TabDef } from '@components/ui/Tabs';
import { DetailSection } from '@components/ui/DetailSection';
import toast from 'react-hot-toast';

const createPermissionSchema = z.object({
  resource: z.string().min(1, 'Resource is required'),
  action: z.string().min(1, 'Action is required'),
  description: z.string().optional(),
});

type CreatePermissionFormData = z.infer<typeof createPermissionSchema>;

const tabs: TabDef[] = [
  { id: 'definition', label: 'Definition', icon: Key },
  { id: 'details', label: 'Details', icon: FileText },
];

export default function PermissionCreatePage() {
  const navigate = useNavigate();
  const createPermission = useCreatePermission();
  const [activeTab, setActiveTab] = useState('definition');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreatePermissionFormData>({
    resolver: zodResolver(createPermissionSchema),
  });

  const onSubmit = async (data: CreatePermissionFormData) => {
    try {
      await createPermission.mutateAsync({
        ...data,
        description: data.description || undefined,
      });
      toast.success('Permission created successfully');
      navigate('/permissions');
    } catch (error: any) {
      const message = error.response?.data?.error?.message || 'Failed to create permission';
      toast.error(message);
    }
  };

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
        <h1 className="text-2xl font-bold text-gray-900">Create Permission</h1>
        <p className="text-gray-500">Add a new permission to the system</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 pt-4">
          <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="px-6">
            {/* Tab: Definition */}
            <div className={activeTab === 'definition' ? '' : 'hidden'}>
              <DetailSection title="Permission Definition" description="Resource and action that this permission controls" noBorder>
                <div className="space-y-4">
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
                </div>
              </DetailSection>
            </div>

            {/* Tab: Details */}
            <div className={activeTab === 'details' ? '' : 'hidden'}>
              <DetailSection title="Additional Details" description="Optional description of what this permission allows" noBorder>
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
              </DetailSection>
            </div>
          </div>

          <div className="px-6 pb-6 flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/permissions')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createPermission.isPending}
              className="btn-primary"
            >
              {createPermission.isPending ? (
                <Spinner size="sm" className="text-white" />
              ) : (
                'Create Permission'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
