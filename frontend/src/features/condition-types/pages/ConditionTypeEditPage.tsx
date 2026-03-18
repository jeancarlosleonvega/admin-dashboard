import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePageHeader } from '@/hooks/usePageHeader';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Lock, Plus, Trash2 } from 'lucide-react';
import { useConditionType, useUpdateConditionType } from '@/hooks/queries/useConditionTypes';
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
  dataType: z.enum(['NUMBER', 'STRING', 'UUID', 'ENUM']),
  allowedOperators: z.array(z.string()).min(1, 'Seleccioná al menos un operador'),
  description: z.string().optional(),
  active: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface EnumOption { value: string; label: string; }

export default function ConditionTypeEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  usePageHeader({ subtitle: 'Editar tipo de condición' });

  const { data: conditionType, isLoading, isError } = useConditionType(id!);
  const updateConditionType = useUpdateConditionType();
  const [enumOptions, setEnumOptions] = useState<EnumOption[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { allowedOperators: [], active: true },
  });

  watch('dataType'); // keep subscription but use conditionType.dataType for display logic

  useEffect(() => {
    if (conditionType) {
      reset({
        name: conditionType.name,
        dataType: conditionType.dataType,
        allowedOperators: conditionType.allowedOperators,
        description: conditionType.description ?? '',
        active: conditionType.active,
      });
      setEnumOptions(conditionType.allowedValues ?? []);
    }
  }, [conditionType, reset]);

  const addOption = () => setEnumOptions((prev) => [...prev, { value: '', label: '' }]);
  const removeOption = (i: number) => setEnumOptions((prev) => prev.filter((_, idx) => idx !== i));
  const updateOption = (i: number, field: keyof EnumOption, val: string) => {
    setEnumOptions((prev) => prev.map((o, idx) => idx === i ? { ...o, [field]: val } : o));
  };

  const onSubmit = async (data: FormData) => {
    if (!id) return;

    if (conditionType.dataType === 'ENUM' && !conditionType.isSystem) {
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
      await updateConditionType.mutateAsync({
        id,
        data: {
          name: data.name,
          dataType: conditionType.dataType,
          allowedOperators: data.allowedOperators,
          allowedValues: (conditionType.dataType === 'ENUM' && !conditionType.isSystem)
            ? enumOptions.map((o) => ({ value: o.value.trim().toUpperCase(), label: o.label.trim() }))
            : undefined,
          description: data.description || null,
          active: data.active,
        },
      });
      toast.success('Tipo de condición actualizado exitosamente');
      navigate('/tipos-condicion');
    } catch (error) {
      const message = (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Error al actualizar el tipo de condición';
      toast.error(message);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  }

  if (isError || !conditionType) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Tipo de condición no encontrado</p>
        <button onClick={() => navigate('/tipos-condicion')} className="mt-4 text-blue-600 hover:underline">Volver</button>
      </div>
    );
  }

  if (conditionType.isSystem) {
    return (
      <div>
        <button onClick={() => navigate('/tipos-condicion')} className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Volver a Tipos de Condición
        </button>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-amber-700">Tipo de condición del sistema — solo lectura</span>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Key</p>
                <p className="text-sm font-mono text-gray-800">{conditionType.key}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Nombre</p>
                <p className="text-sm text-gray-800">{conditionType.name}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Tipo de dato</p>
                <p className="text-sm text-gray-800">{DATA_TYPES.find((d) => d.value === conditionType.dataType)?.label ?? conditionType.dataType}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Estado</p>
                <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${conditionType.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                  {conditionType.active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Operadores permitidos</p>
              <div className="flex flex-wrap gap-1.5">
                {conditionType.allowedOperators.map((op) => (
                  <span key={op} className="inline-flex px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">
                    {OPERATOR_DISPLAY[op] ?? op}
                  </span>
                ))}
              </div>
            </div>
            {conditionType.dataType === 'ENUM' && conditionType.allowedValues && conditionType.allowedValues.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Valores permitidos</p>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Valor interno</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Etiqueta visible</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {conditionType.allowedValues.map((v, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2 font-mono text-xs text-gray-500">{v.value}</td>
                          <td className="px-3 py-2 text-sm text-gray-700">{v.label}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {conditionType.description && (
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Descripción</p>
                <p className="text-sm text-gray-600">{conditionType.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

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
                  <label className="label">Key <span className="text-gray-400 font-normal">(no editable)</span></label>
                  <input
                    type="text"
                    value={conditionType.key}
                    readOnly
                    className="input bg-gray-50 cursor-not-allowed font-mono"
                  />
                </div>
                <div>
                  <label htmlFor="name" className="label">Nombre</label>
                  <input
                    id="name"
                    type="text"
                    className={`input ${errors.name ? 'input-error' : ''}`}
                    {...register('name')}
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="label">Tipo de dato <span className="text-gray-400 font-normal">(no editable)</span></label>
                  <input
                    type="text"
                    value={DATA_TYPES.find((dt) => dt.value === conditionType.dataType)?.label ?? conditionType.dataType}
                    readOnly
                    className="input bg-gray-50 cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-gray-400">El tipo de dato no puede cambiarse para no romper condiciones existentes.</p>
                </div>

                {conditionType.dataType === 'ENUM' && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <label className="label mb-0">Valores permitidos</label>
                      {conditionType.isSystem && (
                        <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-0.5">
                          <Lock className="w-3 h-3" />
                          Valores del sistema — no editables
                        </span>
                      )}
                    </div>

                    {conditionType.isSystem ? (
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Valor interno</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Etiqueta visible</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {(conditionType.allowedValues ?? []).map((opt, i) => (
                              <tr key={i} className="bg-gray-50/50">
                                <td className="px-3 py-2 font-mono text-xs text-gray-500">{opt.value}</td>
                                <td className="px-3 py-2 text-sm text-gray-700">{opt.label}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
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
                    )}
                    {!conditionType.isSystem && (
                      <p className="mt-1 text-xs text-gray-400">El valor interno se guarda tal cual en las condiciones — no lo cambies si ya hay reglas que lo usan.</p>
                    )}
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
            <button type="submit" disabled={updateConditionType.isPending} className="btn-primary">
              {updateConditionType.isPending ? <Spinner size="sm" className="text-white" /> : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
