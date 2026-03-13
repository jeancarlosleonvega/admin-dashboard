import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usePageHeader } from '@/hooks/usePageHeader';
import { useAuthStore } from '@stores/authStore';
import { profileApi } from '@api/profile.api';
import { Spinner } from '@components/ui/Spinner';
import toast from 'react-hot-toast';

const schema = z.object({
  sex: z.enum(['MALE', 'FEMALE'], { required_error: 'Seleccioná un sexo' }),
  birthDate: z.string().min(1, 'La fecha de nacimiento es obligatoria'),
  handicap: z.coerce.number().int().min(0, 'Mínimo 0').max(54, 'Máximo 54'),
});

type FormData = z.infer<typeof schema>;

export default function MyProfilePage() {
  usePageHeader({ subtitle: 'Tus datos personales' });

  const { user, initialize } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (user) {
      reset({
        sex: (user.sex as 'MALE' | 'FEMALE') ?? undefined,
        birthDate: user.birthDate ? user.birthDate.split('T')[0] : '',
        handicap: user.handicap ?? 0,
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      await profileApi.updateMyProfile({
        sex: data.sex,
        birthDate: new Date(data.birthDate).toISOString(),
        handicap: data.handicap,
      });
      await initialize();
      toast.success('Perfil actualizado');
    } catch (error) {
      const message =
        (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message || 'Error al guardar el perfil';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Info básica (solo lectura) */}
      <div className="card p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Información de cuenta</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500 mb-0.5">Nombre</p>
            <p className="font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-0.5">Email</p>
            <p className="font-medium text-gray-900">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Datos de perfil (editables) */}
      <div className="card p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Datos de perfil</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Sexo</label>
            <select className={`input ${errors.sex ? 'input-error' : ''}`} {...register('sex')}>
              <option value="">Seleccioná...</option>
              <option value="MALE">Masculino</option>
              <option value="FEMALE">Femenino</option>
            </select>
            {errors.sex && <p className="mt-1 text-sm text-red-600">{errors.sex.message}</p>}
          </div>

          <div>
            <label className="label">Fecha de nacimiento</label>
            <input
              type="date"
              className={`input ${errors.birthDate ? 'input-error' : ''}`}
              {...register('birthDate')}
            />
            {errors.birthDate && (
              <p className="mt-1 text-sm text-red-600">{errors.birthDate.message}</p>
            )}
          </div>

          <div>
            <label className="label">Handicap</label>
            <input
              type="number"
              min={0}
              max={54}
              step={1}
              placeholder="0 - 54"
              className={`input ${errors.handicap ? 'input-error' : ''}`}
              {...register('handicap')}
            />
            <p className="mt-1 text-xs text-gray-500">Handicap de golf (0 a 54)</p>
            {errors.handicap && (
              <p className="mt-1 text-sm text-red-600">{errors.handicap.message}</p>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !isDirty}
              className="btn-primary disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting && <Spinner size="sm" />}
              Guardar cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
