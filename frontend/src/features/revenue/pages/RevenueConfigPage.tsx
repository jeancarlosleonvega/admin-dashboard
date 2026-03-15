import { useState, useEffect } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { Tabs, TabPanel } from '@components/ui/Tabs';
import type { TabDef } from '@components/ui/Tabs';
import { useRevenue, useUpsertRevenue } from '@hooks/queries/useRevenue';
import type { RevenueConfig, RevenueTimeRule, RevenueDayRule, RevenueOccupancyRule } from '@api/revenue.api';

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

const DAY_TYPE_LABELS: Record<string, string> = {
  WEEKDAY: 'Entre semana',
  FRIDAY: 'Viernes',
  WEEKEND: 'Fin de semana',
  HOLIDAY: 'Festivo',
};

const DAY_TYPES = ['WEEKDAY', 'FRIDAY', 'WEEKEND', 'HOLIDAY'] as const;

type ConfigState = Omit<RevenueConfig, 'id' | 'sportTypeId'>;

function configFromApi(config: RevenueConfig): ConfigState {
  return {
    enabled: config.enabled,
    minPrice: parseFloat(String(config.minPrice)),
    maxPrice: parseFloat(String(config.maxPrice)),
    roundingStep: parseInt(String(config.roundingStep), 10),
    timeRules: config.timeRules.map((r) => ({
      ...r,
      multiplier: parseFloat(String(r.multiplier)),
    })),
    dayRules: config.dayRules.map((r) => ({
      ...r,
      multiplier: parseFloat(String(r.multiplier)),
    })),
    occupancyRules: config.occupancyRules.map((r) => ({
      ...r,
      multiplier: parseFloat(String(r.multiplier)),
    })),
  };
}

interface SportTypePanelProps {
  sportTypeId: string;
  initialConfig: RevenueConfig;
}

function SportTypePanel({ sportTypeId, initialConfig }: SportTypePanelProps) {
  const [state, setState] = useState<ConfigState>(() => configFromApi(initialConfig));
  const upsert = useUpsertRevenue();

  useEffect(() => {
    setState(configFromApi(initialConfig));
  }, [initialConfig]);

  function updateField<K extends keyof ConfigState>(key: K, value: ConfigState[K]) {
    setState((prev) => ({ ...prev, [key]: value }));
  }

  // Time rules
  function addTimeRule() {
    setState((prev) => ({
      ...prev,
      timeRules: [...prev.timeRules, { startTime: '06:00', endTime: '10:00', multiplier: 1.0 }],
    }));
  }
  function updateTimeRule(idx: number, field: keyof RevenueTimeRule, value: string | number) {
    setState((prev) => {
      const rules = [...prev.timeRules];
      rules[idx] = { ...rules[idx], [field]: value };
      return { ...prev, timeRules: rules };
    });
  }
  function removeTimeRule(idx: number) {
    setState((prev) => ({ ...prev, timeRules: prev.timeRules.filter((_, i) => i !== idx) }));
  }

  // Day rules
  function addDayRule() {
    const existing = new Set(state.dayRules.map((r) => r.dayType));
    const next = DAY_TYPES.find((dt) => !existing.has(dt));
    if (!next) return;
    setState((prev) => ({
      ...prev,
      dayRules: [...prev.dayRules, { dayType: next, multiplier: 1.0 }],
    }));
  }
  function updateDayRule(idx: number, field: keyof RevenueDayRule, value: string | number) {
    setState((prev) => {
      const rules = [...prev.dayRules];
      rules[idx] = { ...rules[idx], [field]: value };
      return { ...prev, dayRules: rules };
    });
  }
  function removeDayRule(idx: number) {
    setState((prev) => ({ ...prev, dayRules: prev.dayRules.filter((_, i) => i !== idx) }));
  }

  // Occupancy rules
  function addOccupancyRule() {
    setState((prev) => ({
      ...prev,
      occupancyRules: [...prev.occupancyRules, { minOccupancy: 0, maxOccupancy: 30, multiplier: 1.0 }],
    }));
  }
  function updateOccupancyRule(idx: number, field: keyof RevenueOccupancyRule, value: number) {
    setState((prev) => {
      const rules = [...prev.occupancyRules];
      rules[idx] = { ...rules[idx], [field]: value };
      return { ...prev, occupancyRules: rules };
    });
  }
  function removeOccupancyRule(idx: number) {
    setState((prev) => ({ ...prev, occupancyRules: prev.occupancyRules.filter((_, i) => i !== idx) }));
  }

  function handleSave() {
    upsert.mutate({ sportTypeId, data: state });
  }

  const inputClass = 'border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';
  const trashBtnClass = 'p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors';

  return (
    <div className="space-y-6">
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

      {/* Multiplicadores por Horario */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Multiplicadores por Horario</h3>
        {state.timeRules.length > 0 && (
          <div className="overflow-x-auto mb-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 pr-4 font-medium text-gray-600">Etiqueta</th>
                  <th className="text-left py-2 pr-4 font-medium text-gray-600">Desde</th>
                  <th className="text-left py-2 pr-4 font-medium text-gray-600">Hasta</th>
                  <th className="text-left py-2 pr-4 font-medium text-gray-600">Multiplicador</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {state.timeRules.map((rule, idx) => (
                  <tr key={idx} className="border-b border-gray-100 last:border-0">
                    <td className="py-2 pr-4">
                      <input
                        type="text"
                        value={rule.label ?? ''}
                        onChange={(e) => updateTimeRule(idx, 'label', e.target.value)}
                        placeholder="Ej: Hora valle"
                        className={inputClass}
                      />
                    </td>
                    <td className="py-2 pr-4">
                      <input
                        type="time"
                        value={rule.startTime}
                        onChange={(e) => updateTimeRule(idx, 'startTime', e.target.value)}
                        className={inputClass}
                      />
                    </td>
                    <td className="py-2 pr-4">
                      <input
                        type="time"
                        value={rule.endTime}
                        onChange={(e) => updateTimeRule(idx, 'endTime', e.target.value)}
                        className={inputClass}
                      />
                    </td>
                    <td className="py-2 pr-4">
                      <MultiplierInput
                        value={rule.multiplier}
                        onChange={(v) => updateTimeRule(idx, 'multiplier', v)}
                        className={inputClass}
                      />
                    </td>
                    <td className="py-2">
                      <button onClick={() => removeTimeRule(idx)} className={trashBtnClass} title="Eliminar">
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
          onClick={addTimeRule}
          className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          <Plus className="w-4 h-4" />
          Agregar horario
        </button>
      </div>

      {/* Multiplicadores por Día */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Multiplicadores por Día</h3>
        {state.dayRules.length > 0 && (
          <div className="overflow-x-auto mb-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 pr-4 font-medium text-gray-600">Tipo de día</th>
                  <th className="text-left py-2 pr-4 font-medium text-gray-600">Multiplicador</th>
                  <th className="text-left py-2 pr-4 font-medium text-gray-600">Etiqueta</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {state.dayRules.map((rule, idx) => (
                  <tr key={idx} className="border-b border-gray-100 last:border-0">
                    <td className="py-2 pr-4">
                      <select
                        value={rule.dayType}
                        onChange={(e) => updateDayRule(idx, 'dayType', e.target.value)}
                        className={inputClass}
                      >
                        {DAY_TYPES.map((dt) => (
                          <option key={dt} value={dt}>
                            {DAY_TYPE_LABELS[dt]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 pr-4">
                      <MultiplierInput
                        value={rule.multiplier}
                        onChange={(v) => updateDayRule(idx, 'multiplier', v)}
                        className={inputClass}
                      />
                    </td>
                    <td className="py-2 pr-4">
                      <input
                        type="text"
                        value={rule.label ?? ''}
                        onChange={(e) => updateDayRule(idx, 'label', e.target.value)}
                        placeholder="Etiqueta opcional"
                        className={inputClass}
                      />
                    </td>
                    <td className="py-2">
                      <button onClick={() => removeDayRule(idx)} className={trashBtnClass} title="Eliminar">
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
          onClick={addDayRule}
          disabled={state.dayRules.length >= DAY_TYPES.length}
          className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          Agregar día
        </button>
      </div>

      {/* Multiplicadores por Demanda */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Multiplicadores por Demanda</h3>
        {state.occupancyRules.length > 0 && (
          <div className="overflow-x-auto mb-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 pr-4 font-medium text-gray-600">Desde (%)</th>
                  <th className="text-left py-2 pr-4 font-medium text-gray-600">Hasta (%)</th>
                  <th className="text-left py-2 pr-4 font-medium text-gray-600">Multiplicador</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {state.occupancyRules.map((rule, idx) => (
                  <tr key={idx} className="border-b border-gray-100 last:border-0">
                    <td className="py-2 pr-4">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={1}
                        value={rule.minOccupancy}
                        onChange={(e) => updateOccupancyRule(idx, 'minOccupancy', parseInt(e.target.value, 10) || 0)}
                        className={inputClass}
                      />
                    </td>
                    <td className="py-2 pr-4">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={1}
                        value={rule.maxOccupancy}
                        onChange={(e) => updateOccupancyRule(idx, 'maxOccupancy', parseInt(e.target.value, 10) || 0)}
                        className={inputClass}
                      />
                    </td>
                    <td className="py-2 pr-4">
                      <MultiplierInput
                        value={rule.multiplier}
                        onChange={(v) => updateOccupancyRule(idx, 'multiplier', v)}
                        className={inputClass}
                      />
                    </td>
                    <td className="py-2">
                      <button onClick={() => removeOccupancyRule(idx)} className={trashBtnClass} title="Eliminar">
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
          onClick={addOccupancyRule}
          className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          <Plus className="w-4 h-4" />
          Agregar rango
        </button>
      </div>

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

      {upsert.isSuccess && (
        <p className="text-sm text-green-600 text-right">Configuración guardada correctamente.</p>
      )}
      {upsert.isError && (
        <p className="text-sm text-red-600 text-right">Error al guardar. Intenta nuevamente.</p>
      )}
    </div>
  );
}

export default function RevenueConfigPage() {
  const { data, isLoading, isError } = useRevenue();
  const [activeTab, setActiveTab] = useState<string>('');

  useEffect(() => {
    if (data && data.length > 0 && !activeTab) {
      setActiveTab(data[0].sportType.id);
    }
  }, [data, activeTab]);

  const tabs: TabDef[] = (data ?? []).map((item) => ({
    id: item.sportType.id,
    label: item.sportType.name,
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-gray-500">Cargando configuración...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-red-500">Error al cargar la configuración.</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-gray-500">No hay tipos de deporte activos.</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Motor de Precios</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configura multiplicadores de precio por horario, día de la semana y nivel de ocupación.
        </p>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {data.map((item) => (
        <TabPanel key={item.sportType.id} id={item.sportType.id} activeTab={activeTab}>
          <SportTypePanel sportTypeId={item.sportType.id} initialConfig={item.config} />
        </TabPanel>
      ))}
    </div>
  );
}
