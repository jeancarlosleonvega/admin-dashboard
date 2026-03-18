import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageHeader } from '@/hooks/usePageHeader';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
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

import { OPERATOR_DISPLAY, ALL_OPERATORS } from '@lib/operatorLabels';

const schema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  key: z.string().min(1, 'El key es obligatorio').regex(/^[a-z_]+$/, 'Solo minúsculas y guiones bajos'),
  dataType: z.enum(['NUMBER', 'STRING', 'UUID', 'ENUM']),
  allowedOperators: z.array(z.string()).min(1, 'Seleccioná al menos un operador'),
  description: z.string().optional(),
  active: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface EnumOption { value: string; label: string; }

export default function ConditionTypeCreatePage() {
  const navigate = useNavigate();
  usePageHeader({ subtitle: 'Crear nuevo tipo de condición' });

  const createConditionType = useCreateConditionType();
  const [enumOptions, setEnumOptions] = useState<EnumOption[]>([{ value: '', label: '' }]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { allowedOperators: ['EQ', 'NEQ'], active: true },
  });

  const dataType = watch('dataType');

  const addOption = () => setEnumOptions((prev) => [...prev, { value: '', label: '' }]);
  const removeOption = (i: number) => setEnumOptions((prev) => prev.filter((_, idx) => idx !== i));
  const updateOption = (i: number, field: keyof EnumOption, val: string) => {
    setEnumOptions((prev) => prev.map((o, idx) => idx === i ? { ...o, [field]: val } : o));
  };

  const onSubmit = async (data: FormData) => {
    if (data.dataType === 'ENUM') {
      if (enumOptions.length === 0) {
        toast.error('Agregá al menos un valor para el tipo enumerado');
        return;
      }
      if (enumOptions.some((o) => !o.value.trim() || !o.label.trim())) {
        toast.error('Completá el valor interno y la etiqueta de cada opción');
        return;
      }
    }

    try {
      await createConditionType.mutateAsync({
        name: data.name,
        key: data.key,
        dataType: data.dataType,
        allowedOperators: data.allowedOperators,
        allowedValues: data.dataType === 'ENUM' ? enumOptions.map((o) => ({ value: o.value.trim().toUpperCase(), label: o.label.trim() })) : null,
        isSystem: false,
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
                    placeholder="Ej: Categoría de socio"
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
                    placeholder="Ej: categoria_socio"
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

                {dataType === 'ENUM' && (
                  <div>
                    <label className="label">Valores permitidos</label>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Valor interno</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Etiqueta visible</th>
                            <th className="w-10" />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {enumOptions.map((opt, i) => (
                            <tr key={i}>
                              <td className="px-3 py-2">
                                <input
                                  type="text"
                                  className="input font-mono text-xs"
                                  placeholder="Ej: JUNIOR"
                                  value={opt.value}
                                  onChange={(e) => updateOption(i, 'value', e.target.value)}
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="text"
                                  className="input text-xs"
                                  placeholder="Ej: Junior"
                                  value={opt.label}
                                  onChange={(e) => updateOption(i, 'label', e.target.value)}
                                />
                              </td>
                              <td className="px-2 py-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => removeOption(i)}
                                  className="p-1 text-gray-400 hover:text-red-500"
                                  disabled={enumOptions.length === 1}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="px-3 py-2 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={addOption}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Agregar valor
                        </button>
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-gray-400">El valor interno se guarda tal cual en las condiciones — debe ser consistente y no cambiarse una vez en uso.</p>
                  </div>
                )}

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
                                field.onChange(e.target.checked ? [...current, op] : current.filter((o) => o !== op));
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">{OPERATOR_DISPLAY[op] ?? op}</span>
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
                    rows={2}
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
