import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { useCreateUser } from '@/hooks/queries/useUsers';
import { useRolesList } from '@/hooks/queries/useRoles';
import { Spinner } from '@components/ui/Spinner';
import toast from 'react-hot-toast';

const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  roleIds: z.array(z.string()).optional(),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

export default function UserCreatePage() {
  const navigate = useNavigate();
  const createUser = useCreateUser();
  const { data: roles, isLoading: rolesLoading } = useRolesList();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { roleIds: [] },
  });

  const onSubmit = async (data: CreateUserFormData) => {
    try {
      const roleIds = data.roleIds?.filter(Boolean);
      await createUser.mutateAsync({
        ...data,
        roleIds: roleIds && roleIds.length > 0 ? roleIds : undefined,
      });
      toast.success('User created successfully');
      navigate('/users');
    } catch (error: any) {
      const message = error.response?.data?.error?.message || 'Failed to create user';
      toast.error(message);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => navigate('/users')}
          className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Users
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Create User</h1>
        <p className="text-gray-500">Add a new user to the system</p>
      </div>

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
            <label htmlFor="password" className="label">
              Password
            </label>
            <input
              id="password"
              type="password"
              className={`input ${errors.password ? 'input-error' : ''}`}
              {...register('password')}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Must be at least 8 characters with uppercase, lowercase, and number
            </p>
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
              disabled={createUser.isPending}
              className="btn-primary"
            >
              {createUser.isPending ? (
                <Spinner size="sm" className="text-white" />
              ) : (
                'Create User'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
