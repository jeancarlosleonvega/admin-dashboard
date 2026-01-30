import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useSearchParams } from 'react-router-dom';
import { apiClient } from '@api/client';
import { Spinner } from '@components/ui/Spinner';
import { CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [isLoading, setIsLoading] = useState(false);
  const [isReset, setIsReset] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  if (!token) {
    return (
      <div className="space-y-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Invalid reset link</h2>
        <p className="text-sm text-gray-600">
          This password reset link is invalid or has expired.
        </p>
        <Link
          to="/forgot-password"
          className="inline-block text-blue-600 hover:text-blue-500 font-medium text-sm"
        >
          Request a new reset link
        </Link>
      </div>
    );
  }

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    try {
      await apiClient.post('/auth/reset-password', {
        token,
        password: data.password,
      });
      setIsReset(true);
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || 'Failed to reset password';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isReset) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <CheckCircle className="w-16 h-16 text-green-500" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Password reset!</h2>
          <p className="mt-2 text-sm text-gray-600">
            Your password has been reset successfully. You can now sign in with your new password.
          </p>
        </div>
        <Link
          to="/login"
          className="inline-block btn-primary"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Reset your password</h2>
        <p className="mt-2 text-sm text-gray-600">
          Enter your new password below.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label htmlFor="password" className="label">
            New Password
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

        <div>
          <label htmlFor="confirmPassword" className="label">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            className={`input ${errors.confirmPassword ? 'input-error' : ''}`}
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full"
        >
          {isLoading ? <Spinner size="sm" className="text-white" /> : 'Reset password'}
        </button>
      </form>
    </div>
  );
}
