import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { apiClient } from '@api/client';
import { Spinner } from '@components/ui/Spinner';
import { CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      await apiClient.post('/auth/forgot-password', data);
      setIsSubmitted(true);
    } catch {
      toast.error('Ocurrió un error. Por favor, intentá de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <CheckCircle className="w-16 h-16 text-green-500" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Revisá tu email</h2>
          <p className="mt-2 text-sm text-gray-600">
            Si existe una cuenta con ese email, te enviamos un enlace para restablecer tu contraseña.
            El enlace vence en 1 hora.
          </p>
        </div>
        <Link
          to="/iniciar-sesion"
          className="inline-block text-blue-600 hover:text-blue-500 font-medium text-sm"
        >
          Volver al inicio de sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">¿Olvidaste tu contraseña?</h2>
        <p className="mt-2 text-sm text-gray-600">
          Ingresá tu email y te enviamos un enlace para restablecerla.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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

        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full"
        >
          {isLoading ? <Spinner size="sm" className="text-white" /> : 'Enviar enlace'}
        </button>
      </form>

      <div className="text-center">
        <Link
          to="/iniciar-sesion"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Volver al inicio de sesión
        </Link>
      </div>
    </div>
  );
}
