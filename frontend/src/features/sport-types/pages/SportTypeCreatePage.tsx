import { useNavigate } from 'react-router-dom';
import { usePageHeader } from '@/hooks/usePageHeader';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { useCreateSportType } from '@/hooks/queries/useSportTypes';
import { Spinner } from '@components/ui/Spinner';
import { DetailSection } from '@components/ui/DetailSection';
import toast from 'react-hot-toast';

const schema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(100),
  description: z.string().max(500).optional(),
  active: z.boolean(),
});

type FormData = z.infer<typeof schema>;

export default function SportTypeCreatePage() {
  const navigate = useNavigate();
  usePageHeader({ subtitle: 'Crear nuevo tipo de deporte' });
  const createSportType = useCreateSportType();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      active: true,
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await createSportType.mutateAsync(data);
      toast.success('Tipo de deporte creado exitosamente');
      navigate('/tipos-deporte');
    } catch (error) {
      const message = (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Error al crear el tipo de deporte';
      toast.error(message);
    }
  };

  return (
    <div>
      <button
        onClick={() => navigate('/tipos-deporte')}
        className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Volver a Tipos de Deporte
      </button>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="px-6">
            <DetailSection title="Información general" description="Nombre e identificación del tipo de deporte" noBorder>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="label">Nombre</label>
                  <input
                    id="name"
                    type="text"
                    className={`input ${errors.name ? 'input-error' : ''}`}
                    placeholder="Ej: Pádel, Tenis, Fútbol"
                    {...register('name')}
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
                </div>
                <div>
                  <label htmlFor="description" className="label">Descripción <span className="text-gray-400 font-normal">(opcional)</span></label>
                  <textarea
                    id="description"
                    rows={3}
                    className="input"
                    placeholder="Descripción del tipo de deporte"
                    {...register('description')}
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      {...register('active')}
                    />
                    <span className="text-sm font-medium text-gray-700">Activo</span>
                  </label>
                </div>
              </div>
            </DetailSection>
          </div>

          <div className="px-6 pb-6 flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/tipos-deporte')}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button type="submit" disabled={createSportType.isPending} className="btn-primary">
              {createSportType.isPending ? <Spinner size="sm" className="text-white" /> : 'Crear tipo de deporte'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
