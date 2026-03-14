import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User } from 'lucide-react';
import { useAuthStore } from '@stores/authStore';
import { profileApi } from '@api/profile.api';
import { Spinner } from '@components/ui/Spinner';
import toast from 'react-hot-toast';
import { useState } from 'react';

const schema = z.object({
  sex: z.enum(['MALE', 'FEMALE'], { required_error: 'Seleccioná un sexo' }),
  birthDate: z.string().min(1, 'La fecha de nacimiento es obligatoria'),
  handicap: z.coerce.number().int().min(0, 'Mínimo 0').max(54, 'Máximo 54'),
});

type FormData = z.infer<typeof schema>;

export default function CompleteProfilePage() {
  const navigate = useNavigate();
  const { initialize } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      await profileApi.updateMyProfile({
        sex: data.sex,
        birthDate: new Date(data.birthDate).toISOString(),
        handicap: data.handicap,
      });
      // Re-initialize auth to get updated user with profileCompleted=true
      await initialize();
      toast.success('Perfil completado exitosamente');
      navigate('/inicio');
    } catch (error) {
      const message = (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Error al guardar el perfil';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Completá tu perfil</h1>
          <p className="text-gray-500 mt-2">
            Para poder hacer reservas necesitamos algunos datos adicionales.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label htmlFor="sex" className="label">Sexo</label>
              <select
                id="sex"
                className={`input ${errors.sex ? 'input-error' : ''}`}
                {...register('sex')}
              >
                <option value="">Seleccioná...</option>
                <option value="MALE">Masculino</option>
                <option value="FEMALE">Femenino</option>
              </select>
              {errors.sex && <p className="mt-1 text-sm text-red-600">{errors.sex.message}</p>}
            </div>

            <div>
              <label htmlFor="birthDate" className="label">Fecha de nacimiento</label>
              <input
                id="birthDate"
                type="date"
                className={`input ${errors.birthDate ? 'input-error' : ''}`}
                {...register('birthDate')}
              />
              {errors.birthDate && <p className="mt-1 text-sm text-red-600">{errors.birthDate.message}</p>}
            </div>

            <div>
              <label htmlFor="handicap" className="label">Handicap</label>
              <input
                id="handicap"
                type="number"
                min={0}
                max={54}
                step={1}
                placeholder="0 - 54"
                className={`input ${errors.handicap ? 'input-error' : ''}`}
                {...register('handicap')}
              />
              <p className="mt-1 text-xs text-gray-500">Ingresá tu handicap de golf (0 a 54)</p>
              {errors.handicap && <p className="mt-1 text-sm text-red-600">{errors.handicap.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-primary py-2.5"
            >
              {isSubmitting ? <Spinner size="sm" className="text-white" /> : 'Guardar perfil'}
            </button>
          </form>
        </div>
    </div>
  );
}
