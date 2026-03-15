import { useState, useEffect } from 'react';
import { Trash2, Plus, X, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import { Tabs, TabPanel } from '@components/ui/Tabs';
import type { TabDef } from '@components/ui/Tabs';
import {
  useRevenue,
  useUpsertRevenue,
  useRevenueFactorTypes,
  useCreateFactorType,
  useUpdateFactorType,
  useDeleteFactorType,
} from '@hooks/queries/useRevenue';
import type { RevenueConfig, RevenueConfigInput, RevenueFactorType } from '@api/revenue.api';

// ─── MultiplierInput ──────────────────────────────────────────────────────────

function MultiplierInput({ value, onChange, className }: { value: number; onChange: (v: number) => void; className: string }) {
  const [raw, setRaw] = useState(String(value));

  useEffect(() => {
    setRaw(String(value));
  }, [value]);

  return (
    <input
      type="text"
      inputMode="decimal"
      value={raw}
      onChange={(e) => {
        setRaw(e.target.value);
        const num = parseFloat(e.target.value);
        if (!isNaN(num) && num > 0) onChange(num);
      }}
      onBlur={() => {
        const num = parseFloat(raw);
        if (isNaN(num) || num <= 0) setRaw(String(value));
        else setRaw(String(num));
      }}
      className={className}
    />
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface FactorRuleFormState {
  minValue: string;
  maxValue: string;
  enumValue: string;
  multiplier: number;
  label: string;
}

interface FactorFormState {
  factorTypeId: string;
  enabled: boolean;
  rules: FactorRuleFormState[];
}

interface ConfigFormState {
  enabled: boolean;
  minPrice: number;
  maxPrice: number;
  roundingStep: number;
  factors: FactorFormState[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function emptyRule(): FactorRuleFormState {
  return { minValue: '', maxValue: '', enumValue: '', multiplier: 1.0, label: '' };
}

function configFromApi(config: RevenueConfig, allFactorTypes: RevenueFactorType[]): ConfigFormState {
  const factors: FactorFormState[] = allFactorTypes.map((ft) => {
    const existing = config.factors.find((f) => f.factorTypeId === ft.id);
    if (existing) {
      return {
        factorTypeId: ft.id,
        enabled: existing.enabled,
        rules: existing.rules.map((r) => ({
          minValue: r.minValue ?? '',
          maxValue: r.maxValue ?? '',
          enumValue: r.enumValue ?? '',
          multiplier: parseFloat(String(r.multiplier)),
          label: r.label ?? '',
        })),
      };
    }
    return { factorTypeId: ft.id, enabled: false, rules: [] };
  });

  return {
    enabled: config.enabled,
    minPrice: parseFloat(String(config.minPrice)),
    maxPrice: parseFloat(String(config.maxPrice)),
    roundingStep: parseInt(String(config.roundingStep), 10),
    factors,
  };
}

// ─── FactorPanel ─────────────────────────────────────────────────────────────

interface FactorPanelProps {
  factorType: RevenueFactorType;
  state: FactorFormState;
  onChange: (updated: FactorFormState) => void;
}

function FactorPanel({ factorType, state, onChange }: FactorPanelProps) {
  const inputClass = 'border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full';
  const trashBtnClass = 'p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors';

  function toggleEnabled() {
    onChange({ ...state, enabled: !state.enabled });
  }

  function addRule() {
    onChange({ ...state, rules: [...state.rules, emptyRule()] });
  }

  function removeRule(idx: number) {
    onChange({ ...state, rules: state.rules.filter((_, i) => i !== idx) });
  }

  function updateRule(idx: number, patch: Partial<FactorRuleFormState>) {
    const rules = [...state.rules];
    rules[idx] = { ...rules[idx], ...patch };
    onChange({ ...state, rules });
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
      <div className="flex items-center gap-3 mb-3">
        <input
          type="checkbox"
          id={`factor-${factorType.id}`}
          checked={state.enabled}
          onChange={toggleEnabled}
          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor={`factor-${factorType.id}`} className="text-sm font-semibold text-gray-800">
          {factorType.name}
        </label>
        {factorType.description && (
          <span className="text-xs text-gray-400">{factorType.description}</span>
        )}
      </div>

      {state.enabled && (
        <>
          {state.rules.length > 0 && (
            <div className="overflow-x-auto mb-3">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    {factorType.valueType === 'TIME_RANGE' && (
                      <>
                        <th className="text-left py-2 pr-3 font-medium text-gray-600">Desde</th>
                        <th className="text-left py-2 pr-3 font-medium text-gray-600">Hasta</th>
                      </>
                    )}
                    {factorType.valueType === 'NUMBER_RANGE' && (
                      <>
                        <th className="text-left py-2 pr-3 font-medium text-gray-600">Desde</th>
                        <th className="text-left py-2 pr-3 font-medium text-gray-600">Hasta</th>
                      </>
                    )}
                    {factorType.valueType === 'ENUM' && (
                      <th className="text-left py-2 pr-3 font-medium text-gray-600">Valor</th>
                    )}
                    <th className="text-left py-2 pr-3 font-medium text-gray-600">Etiqueta</th>
                    <th className="text-left py-2 pr-3 font-medium text-gray-600">Multiplicador</th>
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody>
                  {state.rules.map((rule, idx) => (
                    <tr key={idx} className="border-b border-gray-100 last:border-0">
                      {factorType.valueType === 'TIME_RANGE' && (
                        <>
                          <td className="py-2 pr-3">
                            <input
                              type="time"
                              value={rule.minValue}
                              onChange={(e) => updateRule(idx, { minValue: e.target.value })}
                              className={inputClass}
                            />
                          </td>
                          <td className="py-2 pr-3">
                            <input
                              type="time"
                              value={rule.maxValue}
                              onChange={(e) => updateRule(idx, { maxValue: e.target.value })}
                              className={inputClass}
                            />
                          </td>
                        </>
                      )}
                      {factorType.valueType === 'NUMBER_RANGE' && (
                        <>
                          <td className="py-2 pr-3">
                            <input
                              type="number"
                              value={rule.minValue}
                              onChange={(e) => updateRule(idx, { minValue: e.target.value })}
                              className={inputClass}
                            />
                          </td>
                          <td className="py-2 pr-3">
                            <input
                              type="number"
                              value={rule.maxValue}
                              onChange={(e) => updateRule(idx, { maxValue: e.target.value })}
                              className={inputClass}
                            />
                          </td>
                        </>
                      )}
                      {factorType.valueType === 'ENUM' && (
                        <td className="py-2 pr-3">
                          <select
                            value={rule.enumValue}
                            onChange={(e) => updateRule(idx, { enumValue: e.target.value })}
                            className={inputClass}
                          >
                            <option value="">Seleccionar...</option>
                            {factorType.enumValues.map((val, i) => (
                              <option key={val} value={val}>
                                {factorType.enumLabels[i] ?? val}
                              </option>
                            ))}
                          </select>
                        </td>
                      )}
                      <td className="py-2 pr-3">
                        <input
                          type="text"
                          value={rule.label}
                          onChange={(e) => updateRule(idx, { label: e.target.value })}
                          placeholder="Etiqueta opcional"
                          className={inputClass}
                        />
                      </td>
                      <td className="py-2 pr-3">
                        <MultiplierInput
                          value={rule.multiplier}
                          onChange={(v) => updateRule(idx, { multiplier: v })}
                          className={inputClass}
                        />
                      </td>
                      <td className="py-2">
                        <button onClick={() => removeRule(idx)} className={trashBtnClass} title="Eliminar">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <button
            type="button"
            onClick={addRule}
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            <Plus className="w-4 h-4" />
            Agregar regla
          </button>
        </>
      )}
    </div>
  );
}

// ─── SportTypePanel ───────────────────────────────────────────────────────────

interface SportTypePanelProps {
  sportTypeId: string;
  initialConfig: RevenueConfig;
  factorTypes: RevenueFactorType[];
}

function SportTypePanel({ sportTypeId, initialConfig, factorTypes }: SportTypePanelProps) {
  const [state, setState] = useState<ConfigFormState>(() => configFromApi(initialConfig, factorTypes));
  const upsert = useUpsertRevenue();

  useEffect(() => {
    setState(configFromApi(initialConfig, factorTypes));
  }, [initialConfig, factorTypes]);

  function updateField<K extends keyof Omit<ConfigFormState, 'factors'>>(key: K, value: ConfigFormState[K]) {
    setState((prev) => ({ ...prev, [key]: value }));
  }

  function updateFactor(factorTypeId: string, updated: FactorFormState) {
    setState((prev) => ({
      ...prev,
      factors: prev.factors.map((f) => (f.factorTypeId === factorTypeId ? updated : f)),
    }));
  }

  function handleSave() {
    const payload: RevenueConfigInput = {
      enabled: state.enabled,
      minPrice: state.minPrice,
      maxPrice: state.maxPrice,
      roundingStep: state.roundingStep,
      factors: state.factors.map((f) => ({
        factorTypeId: f.factorTypeId,
        enabled: f.enabled,
        rules: f.rules.map((r) => ({
          minValue: r.minValue || null,
          maxValue: r.maxValue || null,
          enumValue: r.enumValue || null,
          multiplier: r.multiplier,
          label: r.label || null,
        })),
      })),
    };

    upsert.mutate(
      { sportTypeId, data: payload },
      {
        onSuccess: () => toast.success('Configuración guardada correctamente'),
        onError: () => toast.error('Error al guardar. Intenta nuevamente.'),
      }
    );
  }

  const inputClass = 'border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <div className="space-y-5">
      {/* Configuración General */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Configuración General</h3>
        <div className="flex items-center gap-3 mb-4">
          <input
            type="checkbox"
            id={`enabled-${sportTypeId}`}
            checked={state.enabled}
            onChange={(e) => updateField('enabled', e.target.checked)}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor={`enabled-${sportTypeId}`} className="text-sm font-medium text-gray-700">
            Motor habilitado
          </label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Precio mínimo</label>
            <input
              type="number"
              min={0}
              value={state.minPrice}
              onChange={(e) => updateField('minPrice', parseFloat(e.target.value) || 0)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Precio máximo</label>
            <input
              type="number"
              min={0}
              value={state.maxPrice}
              onChange={(e) => updateField('maxPrice', parseFloat(e.target.value) || 0)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Paso de redondeo</label>
            <input
              type="number"
              min={0}
              step={1}
              value={state.roundingStep}
              onChange={(e) => updateField('roundingStep', parseInt(e.target.value, 10) || 0)}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Factores */}
      {factorTypes.map((ft) => {
        const factorState = state.factors.find((f) => f.factorTypeId === ft.id);
        if (!factorState) return null;
        return (
          <FactorPanel
            key={ft.id}
            factorType={ft}
            state={factorState}
            onChange={(updated) => updateFactor(ft.id, updated)}
          />
        );
      })}

      {/* Save button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={upsert.isPending}
          className="btn-primary px-6 py-2 text-sm font-medium disabled:opacity-60"
        >
          {upsert.isPending ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
}

// ─── NewFactorTypeForm ────────────────────────────────────────────────────────

interface EnumEntry {
  value: string;
  label: string;
}

function NewFactorTypeForm({ onClose }: { onClose: () => void }) {
  const createFactorType = useCreateFactorType();
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [valueType, setValueType] = useState<'NUMBER_RANGE' | 'TIME_RANGE' | 'ENUM'>('NUMBER_RANGE');
  const [description, setDescription] = useState('');
  const [enumEntries, setEnumEntries] = useState<EnumEntry[]>([{ value: '', label: '' }]);

  function addEnumEntry() {
    setEnumEntries((prev) => [...prev, { value: '', label: '' }]);
  }

  function removeEnumEntry(idx: number) {
    setEnumEntries((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateEnumEntry(idx: number, field: 'value' | 'label', val: string) {
    setEnumEntries((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: val };
      return updated;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = {
      name,
      key,
      valueType,
      description: description || undefined,
      enumValues: valueType === 'ENUM' ? enumEntries.map((e) => e.value).filter(Boolean) : [],
      enumLabels: valueType === 'ENUM' ? enumEntries.map((e) => e.label).filter(Boolean) : [],
    };
    createFactorType.mutate(data, {
      onSuccess: () => {
        toast.success('Tipo de factor creado');
        onClose();
      },
      onError: () => toast.error('Error al crear el tipo de factor'),
    });
  }

  const inputClass = 'border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900">Nuevo tipo de factor</h3>
        <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
          <X className="w-4 h-4" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Nombre</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Clave (key)</label>
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="ej: myFactor"
              required
              pattern="^[a-zA-Z][a-zA-Z0-9_]*$"
              className={inputClass}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Tipo de valor</label>
            <select value={valueType} onChange={(e) => setValueType(e.target.value as typeof valueType)} className={inputClass}>
              <option value="NUMBER_RANGE">Rango numérico</option>
              <option value="TIME_RANGE">Rango horario</option>
              <option value="ENUM">Enumerado</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Descripción</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} />
          </div>
        </div>

        {valueType === 'ENUM' && (
          <div>
            <label className={labelClass}>Valores del enumerado</label>
            <div className="space-y-2">
              {enumEntries.map((entry, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={entry.value}
                    onChange={(e) => updateEnumEntry(idx, 'value', e.target.value)}
                    placeholder="Valor interno"
                    className={inputClass}
                  />
                  <input
                    type="text"
                    value={entry.label}
                    onChange={(e) => updateEnumEntry(idx, 'label', e.target.value)}
                    placeholder="Etiqueta visible"
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => removeEnumEntry(idx)}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addEnumEntry}
                className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                <Plus className="w-4 h-4" />
                Agregar valor
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={createFactorType.isPending}
            className="btn-primary px-5 py-2 text-sm font-medium disabled:opacity-60"
          >
            {createFactorType.isPending ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── EditFactorTypeForm ───────────────────────────────────────────────────────

function EditFactorTypeForm({ factorType, onClose }: { factorType: RevenueFactorType; onClose: () => void }) {
  const updateFactorType = useUpdateFactorType();
  const [name, setName] = useState(factorType.name);
  const [description, setDescription] = useState(factorType.description ?? '');
  const [enumEntries, setEnumEntries] = useState<EnumEntry[]>(
    factorType.enumValues.map((val, i) => ({ value: val, label: factorType.enumLabels[i] ?? '' }))
  );

  function addEnumEntry() {
    setEnumEntries((prev) => [...prev, { value: '', label: '' }]);
  }

  function removeEnumEntry(idx: number) {
    setEnumEntries((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateEnumEntry(idx: number, field: 'value' | 'label', val: string) {
    setEnumEntries((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: val };
      return updated;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data: { name?: string; description?: string | null; enumValues?: string[]; enumLabels?: string[] } = {
      name,
      description: description || null,
    };
    if (factorType.valueType === 'ENUM') {
      data.enumValues = enumEntries.map((e) => e.value).filter(Boolean);
      data.enumLabels = enumEntries.map((e) => e.label).filter(Boolean);
    }
    updateFactorType.mutate({ id: factorType.id, data }, {
      onSuccess: () => {
        toast.success('Tipo de factor actualizado');
        onClose();
      },
      onError: () => toast.error('Error al actualizar el tipo de factor'),
    });
  }

  const inputClass = 'border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <div className="bg-white rounded-lg border border-blue-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900">Editar tipo de factor</h3>
        <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
          <X className="w-4 h-4" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Nombre</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Descripción</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} />
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-400">
            Clave: <span className="font-mono">{factorType.key}</span> · Tipo: {factorType.valueType === 'NUMBER_RANGE' ? 'Rango numérico' : factorType.valueType === 'TIME_RANGE' ? 'Rango horario' : 'Enumerado'} — no modificables
          </p>
        </div>

        {factorType.valueType === 'ENUM' && (
          <div>
            <label className={labelClass}>Valores del enumerado</label>
            <div className="space-y-2">
              {enumEntries.map((entry, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={entry.value}
                    onChange={(e) => updateEnumEntry(idx, 'value', e.target.value)}
                    placeholder="Valor interno"
                    className={inputClass}
                  />
                  <input
                    type="text"
                    value={entry.label}
                    onChange={(e) => updateEnumEntry(idx, 'label', e.target.value)}
                    placeholder="Etiqueta visible"
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => removeEnumEntry(idx)}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addEnumEntry}
                className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                <Plus className="w-4 h-4" />
                Agregar valor
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={updateFactorType.isPending}
            className="btn-primary px-5 py-2 text-sm font-medium disabled:opacity-60"
          >
            {updateFactorType.isPending ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── FactorTypesTab ───────────────────────────────────────────────────────────

function FactorTypesTab() {
  const { data: factorTypes, isLoading } = useRevenueFactorTypes();
  const deleteFactorType = useDeleteFactorType();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  function handleDelete(id: string, name: string) {
    if (!confirm(`¿Eliminar el tipo de factor "${name}"?`)) return;
    deleteFactorType.mutate(id, {
      onSuccess: () => toast.success('Tipo de factor eliminado'),
      onError: () => toast.error('Error al eliminar'),
    });
  }

  if (isLoading) return <div className="py-10 text-center text-sm text-gray-400">Cargando...</div>;

  const editingFt = editingId ? (factorTypes ?? []).find((ft) => ft.id === editingId) : null;

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Nombre</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Clave</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Tipo</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Descripción</th>
              <th className="py-3 px-4" />
            </tr>
          </thead>
          <tbody>
            {(factorTypes ?? []).map((ft) => (
              <tr key={ft.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium text-gray-800">
                  {ft.name}
                  {ft.isSystem && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">sistema</span>
                  )}
                </td>
                <td className="py-3 px-4 text-gray-500 font-mono text-xs">{ft.key}</td>
                <td className="py-3 px-4 text-gray-500">
                  {ft.valueType === 'NUMBER_RANGE' && 'Rango numérico'}
                  {ft.valueType === 'TIME_RANGE' && 'Rango horario'}
                  {ft.valueType === 'ENUM' && 'Enumerado'}
                </td>
                <td className="py-3 px-4 text-gray-400 text-xs">{ft.description ?? '—'}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => { setEditingId(ft.id); setShowForm(false); }}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    {!ft.isSystem && (
                      <button
                        onClick={() => handleDelete(ft.id, ft.name)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {(factorTypes ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="py-10 text-center text-sm text-gray-400">
                  No hay tipos de factor definidos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editingFt && (
        <EditFactorTypeForm factorType={editingFt} onClose={() => setEditingId(null)} />
      )}

      {!editingFt && (showForm ? (
        <NewFactorTypeForm onClose={() => setShowForm(false)} />
      ) : (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            <Plus className="w-4 h-4" />
            Nuevo tipo de factor
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── RevenueConfigPage ────────────────────────────────────────────────────────

const FACTOR_TYPES_TAB_ID = '__factor_types__';

export default function RevenueConfigPage() {
  const { data, isLoading: revenueLoading, isError: revenueError } = useRevenue();
  const { data: factorTypes, isLoading: ftLoading } = useRevenueFactorTypes();
  const [activeTab, setActiveTab] = useState<string>('');

  useEffect(() => {
    if (data && data.length > 0 && !activeTab) {
      setActiveTab(data[0].sportType.id);
    }
  }, [data, activeTab]);

  const sportTabs: TabDef[] = (data ?? []).map((item) => ({
    id: item.sportType.id,
    label: item.sportType.name,
  }));

  const tabs: TabDef[] = [
    ...sportTabs,
    { id: FACTOR_TYPES_TAB_ID, label: 'Tipos de Factor' },
  ];

  const isLoading = revenueLoading || ftLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-gray-500">Cargando configuración...</div>
      </div>
    );
  }

  if (revenueError) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-red-500">Error al cargar la configuración.</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Motor de Precios</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configura factores de ajuste de precio dinámico por deporte.
        </p>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab || (tabs[0]?.id ?? '')} onTabChange={setActiveTab} />

      {(data ?? []).map((item) => (
        <TabPanel key={item.sportType.id} id={item.sportType.id} activeTab={activeTab}>
          <SportTypePanel
            sportTypeId={item.sportType.id}
            initialConfig={item.config}
            factorTypes={factorTypes ?? []}
          />
        </TabPanel>
      ))}

      <TabPanel id={FACTOR_TYPES_TAB_ID} activeTab={activeTab}>
        <FactorTypesTab />
      </TabPanel>
    </div>
  );
}
