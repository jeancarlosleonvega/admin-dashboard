import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usePageHeader } from '@/hooks/usePageHeader';
import { useAuthStore } from '@stores/authStore';
import { profileApi } from '@api/profile.api';
import { Spinner } from '@components/ui/Spinner';
import { DetailSection } from '@components/ui/DetailSection';
import toast from 'react-hot-toast';

const schema = z.object({
  sex: z.enum(['MALE', 'FEMALE'], { required_error: 'Seleccioná un sexo' }),
  birthDate: z.string().min(1, 'La fecha de nacimiento es obligatoria'),
  handicap: z.coerce.number().int().min(0, 'Mínimo 0').max(54, 'Máximo 54'),
});

type FormData = z.infer<typeof schema>;

export default function MyProfilePage() {
  usePageHeader({});

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
    <div>
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 pb-6">
          <form onSubmit={handleSubmit(onSubmit)}>
            <DetailSection title="Información de cuenta" description="Datos de acceso a la plataforma.">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Nombre</label>
                  <input type="text" className="input bg-gray-50" value={user?.firstName ?? ''} readOnly />
                </div>
                <div>
                  <label className="label">Apellido</label>
                  <input type="text" className="input bg-gray-50" value={user?.lastName ?? ''} readOnly />
                </div>
              </div>
              <div className="mt-4">
                <label className="label">Email</label>
                <input type="text" className="input bg-gray-50" value={user?.email ?? ''} readOnly />
              </div>
            </DetailSection>

            <DetailSection title="Datos de perfil" description="Información necesaria para las reservas." noBorder>
              <div className="space-y-4">
                <div>
                  <label htmlFor="sex" className="label">Sexo</label>
                  <select id="sex" className={`input ${errors.sex ? 'input-error' : ''}`} {...register('sex')}>
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
                  {errors.birthDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.birthDate.message}</p>
                  )}
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
                  <p className="mt-1 text-xs text-gray-500">Handicap de golf (0 a 54)</p>
                  {errors.handicap && (
                    <p className="mt-1 text-sm text-red-600">{errors.handicap.message}</p>
                  )}
                </div>
              </div>

              {isDirty && (
                <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSubmitting && <Spinner size="sm" className="text-white" />}
                    Guardar cambios
                  </button>
                </div>
              )}
            </DetailSection>
          </form>
        </div>
      </div>
    </div>
  );
}
