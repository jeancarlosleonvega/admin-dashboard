import { useNavigate } from 'react-router-dom';
import { usePageHeader } from '@/hooks/usePageHeader';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { useCreateConditionType } from '@/hooks/queries/useConditionTypes';
import { Spinner } from '@components/ui/Spinner';
import { DetailSection } from '@components/ui/DetailSection';
import toast from 'react-hot-toast';

const DATA_TYPES = [
  { value: 'NUMBER', label: 'Número' },
  { value: 'STRING', label: 'Texto' },
  { value: 'UUID', label: 'UUID' },
  { value: 'ENUM', label: 'Enumerado' },
];

const ALL_OPERATORS = ['EQ', 'NEQ', 'GT', 'GTE', 'LT', 'LTE'];

const schema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  key: z.string().min(1, 'El key es obligatorio').regex(/^[a-z_]+$/, 'Solo minúsculas y guiones bajos'),
  dataType: z.enum(['NUMBER', 'STRING', 'UUID', 'ENUM']),
  allowedOperators: z.array(z.string()).min(1, 'Seleccioná al menos un operador'),
  description: z.string().optional(),
  active: z.boolean(),
});

type FormData = z.infer<typeof schema>;

export default function ConditionTypeCreatePage() {
  const navigate = useNavigate();
  usePageHeader({ subtitle: 'Crear nuevo tipo de condición' });

  const createConditionType = useCreateConditionType();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      allowedOperators: ['EQ', 'NEQ'],
      active: true,
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await createConditionType.mutateAsync({
        name: data.name,
        key: data.key,
        dataType: data.dataType,
        allowedOperators: data.allowedOperators,
        description: data.description || null,
        active: data.active,
      });
      toast.success('Tipo de condición creado exitosamente');
      navigate('/tipos-condicion');
    } catch (error) {
      const message = (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Error al crear el tipo de condición';
      toast.error(message);
    }
  };

  return (
    <div>
      <button
        onClick={() => navigate('/tipos-condicion')}
        className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Volver a Tipos de Condición
      </button>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="px-6">
            <DetailSection title="Información" description="Datos del tipo de condición">
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="label">Nombre</label>
                  <input
                    id="name"
                    type="text"
                    className={`input ${errors.name ? 'input-error' : ''}`}
                    placeholder="Ej: Tipo de membresía"
                    {...register('name')}
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
                </div>
                <div>
                  <label htmlFor="key" className="label">Key <span className="text-gray-400 font-normal">(único, no se puede cambiar)</span></label>
                  <input
                    id="key"
                    type="text"
                    className={`input font-mono ${errors.key ? 'input-error' : ''}`}
                    placeholder="Ej: membership_plan"
                    {...register('key')}
                  />
                  {errors.key && <p className="mt-1 text-sm text-red-600">{errors.key.message}</p>}
                </div>
                <div>
                  <label htmlFor="dataType" className="label">Tipo de dato</label>
                  <select
                    id="dataType"
                    className={`input ${errors.dataType ? 'input-error' : ''}`}
                    {...register('dataType')}
                  >
                    <option value="">Seleccioná...</option>
                    {DATA_TYPES.map((dt) => (
                      <option key={dt.value} value={dt.value}>{dt.label}</option>
                    ))}
                  </select>
                  {errors.dataType && <p className="mt-1 text-sm text-red-600">{errors.dataType.message}</p>}
                </div>
                <div>
                  <label className="label">Operadores permitidos</label>
                  <Controller
                    name="allowedOperators"
                    control={control}
                    render={({ field }) => (
                      <div className="flex flex-wrap gap-3">
                        {ALL_OPERATORS.map((op) => (
                          <label key={op} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={field.value?.includes(op)}
                              onChange={(e) => {
                                const current = field.value ?? [];
                                if (e.target.checked) {
                                  field.onChange([...current, op]);
                                } else {
                                  field.onChange(current.filter((o) => o !== op));
                                }
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm font-mono text-gray-700">{op}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  />
                  {errors.allowedOperators && <p className="mt-1 text-sm text-red-600">{errors.allowedOperators.message}</p>}
                </div>
                <div>
                  <label htmlFor="description" className="label">Descripción <span className="text-gray-400 font-normal">(opcional)</span></label>
                  <textarea
                    id="description"
                    rows={3}
                    className="input"
                    placeholder="Descripción del tipo de condición..."
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
            <button type="button" onClick={() => navigate('/tipos-condicion')} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={createConditionType.isPending} className="btn-primary">
              {createConditionType.isPending ? <Spinner size="sm" className="text-white" /> : 'Crear tipo de condición'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
