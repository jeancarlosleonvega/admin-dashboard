import { useState } from 'react';
import { useSystemConfigs, useUpsertConfig } from '@/hooks/queries/useSystemConfig';
import type { SystemConfig } from '@/types/system-config.types';
import { Spinner } from '@components/ui/Spinner';
import toast from 'react-hot-toast';

export default function SystemConfigPage() {
  const { data: configs, isLoading, isError } = useSystemConfigs();
  const upsertConfig = useUpsertConfig();
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-12 text-center text-red-500">
        <p>No se pudo cargar la configuración del sistema.</p>
      </div>
    );
  }

  const groups = configs
    ? Array.from(new Set(configs.map((c) => c.group ?? 'general'))).sort()
    : [];

  const groupedConfigs = groups.reduce<Record<string, SystemConfig[]>>((acc, group) => {
    acc[group] = (configs ?? []).filter((c) => (c.group ?? 'general') === group);
    return acc;
  }, {});

  const getValue = (config: SystemConfig) =>
    editValues[config.key] !== undefined ? editValues[config.key] : config.value;

  const handleSave = async (config: SystemConfig) => {
    const newValue = editValues[config.key];
    if (newValue === undefined || newValue === config.value) {
      toast('No hay cambios que guardar', { icon: 'ℹ️' });
      return;
    }
    setSavingKey(config.key);
    try {
      await upsertConfig.mutateAsync({
        key: config.key,
        value: newValue,
        label: config.label ?? undefined,
        group: config.group ?? undefined,
      });
      toast.success(`Configuración "${config.label ?? config.key}" guardada`);
      setEditValues((prev) => {
        const next = { ...prev };
        delete next[config.key];
        return next;
      });
    } catch {
      toast.error('Error al guardar la configuración');
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group} className="card overflow-hidden">
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">{group}</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">Etiqueta</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Clave</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {groupedConfigs[group].map((config) => (
                <tr key={config.key} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-sm text-gray-700">{config.label ?? config.key}</td>
                  <td className="px-6 py-3 text-xs font-mono text-gray-500">{config.key}</td>
                  <td className="px-6 py-3">
                    <input
                      type="text"
                      className="input py-1.5 text-sm"
                      value={getValue(config)}
                      onChange={(e) =>
                        setEditValues((prev) => ({ ...prev, [config.key]: e.target.value }))
                      }
                    />
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button
                      onClick={() => handleSave(config)}
                      disabled={savingKey === config.key}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {savingKey === config.key ? <Spinner size="sm" className="text-white" /> : 'Guardar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
