import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { apiClient } from '@api/client';
import { useAuthStore } from '@stores/authStore';
import { Spinner } from '@components/ui/Spinner';
import toast from 'react-hot-toast';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { setAccessToken, setUser } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post('/auth/register', data);
      const { user, permissions, accessToken } = response.data.data;

      // Set auth state
      useAuthStore.setState({
        user,
        permissions,
        accessToken,
        isAuthenticated: true,
      });

      toast.success('Account created successfully!');
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || 'Registration failed';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Create your account</h2>
        <p className="mt-2 text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:text-blue-500 font-medium">
            Sign in
          </Link>
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="label">
              First Name
            </label>
            <input
              id="firstName"
              type="text"
              autoComplete="given-name"
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
              autoComplete="family-name"
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
            autoComplete="email"
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
            autoComplete="new-password"
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

        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full"
        >
          {isLoading ? <Spinner size="sm" className="text-white" /> : 'Create account'}
        </button>
      </form>
    </div>
  );
}
