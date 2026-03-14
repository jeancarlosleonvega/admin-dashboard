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
      .min(8, 'Mínimo 8 caracteres')
      .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
      .regex(/[a-z]/, 'Debe contener al menos una minúscula')
      .regex(/[0-9]/, 'Debe contener al menos un número'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
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
        <h2 className="text-2xl font-bold text-gray-900">Enlace inválido</h2>
        <p className="text-sm text-gray-600">
          Este enlace para restablecer la contraseña es inválido o ha expirado.
        </p>
        <Link
          to="/olvide-contrasena"
          className="inline-block text-blue-600 hover:text-blue-500 font-medium text-sm"
        >
          Solicitar un nuevo enlace
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
    } catch (error) {
      const message =
        (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Error al restablecer la contraseña';
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
          <h2 className="text-2xl font-bold text-gray-900">¡Contraseña restablecida!</h2>
          <p className="mt-2 text-sm text-gray-600">
            Tu contraseña fue restablecida exitosamente. Ya podés iniciar sesión con tu nueva contraseña.
          </p>
        </div>
        <Link
          to="/iniciar-sesion"
          className="inline-block btn-primary"
        >
          Iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Restablecer contraseña</h2>
        <p className="mt-2 text-sm text-gray-600">
          Ingresá tu nueva contraseña.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label htmlFor="password" className="label">
            Nueva contraseña
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
            Mínimo 8 caracteres con mayúscula, minúscula y número
          </p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="label">
            Confirmar contraseña
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
          {isLoading ? <Spinner size="sm" className="text-white" /> : 'Restablecer contraseña'}
        </button>
      </form>
    </div>
  );
}
