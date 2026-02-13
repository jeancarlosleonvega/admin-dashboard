import { useNavigate, useParams } from 'react-router-dom';
import { usePageHeader } from '@/hooks/usePageHeader';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useUser, useUpdateUser } from '@/hooks/queries/useUsers';
import { useRolesList } from '@/hooks/queries/useRoles';
import { Spinner } from '@components/ui/Spinner';
import { UserStatus } from '@/types/user.types';
import toast from 'react-hot-toast';

const updateUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  status: z.nativeEnum(UserStatus),
  roleIds: z.array(z.string()).optional(),
});

type UpdateUserFormData = z.infer<typeof updateUserSchema>;

export default function UserEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  usePageHeader({});
  const { data: user, isLoading, isError } = useUser(id!);
  const { data: roles, isLoading: rolesLoading } = useRolesList();
  const updateUser = useUpdateUser();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
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
      toast.success('User updated successfully');
      navigate('/users');
    } catch (error: any) {
      const message = error.response?.data?.error?.message || 'Failed to update user';
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
        <p className="text-red-500">User not found</p>
        <button onClick={() => navigate('/users')} className="mt-4 text-blue-600 hover:underline">
          Back to Users
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => navigate('/users')}
        className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Users
      </button>

      <div className="card p-6 max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="label">
                First Name
              </label>
              <input
                id="firstName"
                type="text"
                className={`input ${errors.firstName ? 'input-error' : ''}`}
                {...register('firstName')}
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="lastName" className="label">
                Last Name
              </label>
              <input
                id="lastName"
                type="text"
                className={`input ${errors.lastName ? 'input-error' : ''}`}
                {...register('lastName')}
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="email" className="label">
              Email
            </label>
            <input
              id="email"
              type="email"
              className={`input ${errors.email ? 'input-error' : ''}`}
              {...register('email')}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="status" className="label">
              Status
            </label>
            <select
              id="status"
              className={`input ${errors.status ? 'input-error' : ''}`}
              {...register('status')}
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
            {errors.status && (
              <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
            )}
          </div>

          <div>
            <label className="label">Roles</label>
            {rolesLoading ? (
              <Spinner size="sm" />
            ) : (
              <div className="space-y-2">
                {roles?.map((role) => (
                  <label key={role.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      value={role.id}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      {...register('roleIds')}
                    />
                    <span className="text-sm text-gray-700">{role.name}</span>
                    {role.description && (
                      <span className="text-xs text-gray-400">- {role.description}</span>
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => navigate('/users')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateUser.isPending}
              className="btn-primary"
            >
              {updateUser.isPending ? (
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
