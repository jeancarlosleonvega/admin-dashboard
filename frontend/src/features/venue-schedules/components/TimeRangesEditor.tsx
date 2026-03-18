import { Plus, Trash2 } from 'lucide-react';
import ScheduleRulesEditor from './ScheduleRulesEditor';
import type { RuleFormValue } from './ScheduleRulesEditor';

const DAYS = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 7, label: 'Domingo' },
];

export interface TimeRangeFormValue {
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  intervalMinutes: number;
  playersPerSlot: number;
  active: boolean;
  rules: RuleFormValue[];
}

interface Props {
  timeRanges: TimeRangeFormValue[];
  onChange: (timeRanges: TimeRangeFormValue[]) => void;
}

const DEFAULT_TIME_RANGE: TimeRangeFormValue = {
  daysOfWeek: [],
  startTime: '08:00',
  endTime: '18:00',
  intervalMinutes: 60,
  playersPerSlot: 4,
  active: true,
  rules: [],
};

export default function TimeRangesEditor({ timeRanges, onChange }: Props) {
  const addTimeRange = () => {
    onChange([...timeRanges, { ...DEFAULT_TIME_RANGE, daysOfWeek: [] }]);
  };

  const removeTimeRange = (idx: number) => {
    onChange(timeRanges.filter((_, i) => i !== idx));
  };

  const updateTimeRange = (idx: number, partial: Partial<TimeRangeFormValue>) => {
    onChange(timeRanges.map((tr, i) => (i === idx ? { ...tr, ...partial } : tr)));
  };

  const toggleDay = (idx: number, day: number) => {
    const tr = timeRanges[idx];
    const current = tr.daysOfWeek;
    const updated = current.includes(day) ? current.filter((d) => d !== day) : [...current, day].sort();
    updateTimeRange(idx, { daysOfWeek: updated });
  };

  return (
    <div className="space-y-4">
      {timeRanges.length === 0 && (
        <p className="text-sm text-gray-400 italic">Agregá al menos un bloque de tiempo para este horario.</p>
      )}

      {timeRanges.map((tr, idx) => (
        <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-gray-700">Bloque {idx + 1}</span>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 cursor-pointer text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={tr.active}
                  onChange={(e) => updateTimeRange(idx, { active: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Activo
              </label>
              <button type="button" onClick={() => removeTimeRange(idx)} className="p-1 text-gray-400 hover:text-red-500">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Días de la semana */}
          <div className="mb-4">
            <label className="label text-xs">Días de la semana</label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {DAYS.map((day) => {
                const selected = tr.daysOfWeek.includes(day.value);
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(idx, day.value)}
                    className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                      selected
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Configuración de tiempo */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div>
              <label className="label text-xs">Hora inicio</label>
              <input
                type="time"
                className="input"
                value={tr.startTime}
                onChange={(e) => updateTimeRange(idx, { startTime: e.target.value })}
              />
            </div>
            <div>
              <label className="label text-xs">Hora fin</label>
              <input
                type="time"
                className="input"
                value={tr.endTime}
                onChange={(e) => updateTimeRange(idx, { endTime: e.target.value })}
              />
            </div>
            <div>
              <label className="label text-xs">Intervalo (min)</label>
              <input
                type="number"
                min={5}
                max={240}
                className="input"
                value={tr.intervalMinutes}
                onChange={(e) => updateTimeRange(idx, { intervalMinutes: parseInt(e.target.value) || 60 })}
              />
            </div>
            <div>
              <label className="label text-xs">Jugadores/turno</label>
              <input
                type="number"
                min={1}
                max={100}
                className="input"
                value={tr.playersPerSlot}
                onChange={(e) => updateTimeRange(idx, { playersPerSlot: parseInt(e.target.value) || 4 })}
              />
            </div>
          </div>

          {/* Reglas de acceso para este bloque */}
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Reglas de acceso</div>
            <ScheduleRulesEditor
              rules={tr.rules}
              onChange={(rules) => updateTimeRange(idx, { rules })}
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addTimeRange}
        className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Agregar bloque de tiempo
      </button>
    </div>
  );
}
