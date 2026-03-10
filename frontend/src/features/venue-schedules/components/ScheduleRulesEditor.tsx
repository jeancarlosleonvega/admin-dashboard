import { useConditionTypes } from '@/hooks/queries/useConditionTypes';
import { useMembershipPlans } from '@/hooks/queries/useMembershipPlans';
import { Plus, Trash2 } from 'lucide-react';
import { Spinner } from '@components/ui/Spinner';

export interface RuleConditionFormValue {
  conditionTypeId: string;
  operator: string;
  value: string;
  logicalOperator: string;
  order: number;
}

export interface RuleFormValue {
  canBook: boolean;
  basePrice: number;
  revenueManagementEnabled: boolean;
  conditions: RuleConditionFormValue[];
}

interface Props {
  rules: RuleFormValue[];
  onChange: (rules: RuleFormValue[]) => void;
}

const OPERATOR_LABELS: Record<string, string> = {
  EQ: '= igual a',
  NEQ: '≠ distinto de',
  GT: '> mayor que',
  GTE: '>= mayor o igual que',
  LT: '< menor que',
  LTE: '<= menor o igual que',
};

const SEX_OPTIONS = [
  { value: 'MALE', label: 'Masculino' },
  { value: 'FEMALE', label: 'Femenino' },
];

export default function ScheduleRulesEditor({ rules, onChange }: Props) {
  const { data: conditionTypesData, isLoading: ctLoading } = useConditionTypes({ active: 'true', limit: 100 });
  const { data: membershipPlansData } = useMembershipPlans({ active: 'true', limit: 100 });

  const conditionTypes = conditionTypesData?.data ?? [];
  const membershipPlans = membershipPlansData?.data ?? [];

  const addRule = () => {
    onChange([
      ...rules,
      {
        canBook: true,
        basePrice: 0,
        revenueManagementEnabled: false,
        conditions: [
          { conditionTypeId: '', operator: 'EQ', value: '', logicalOperator: '', order: 0 },
        ],
      },
    ]);
  };

  const removeRule = (ruleIdx: number) => {
    onChange(rules.filter((_, i) => i !== ruleIdx));
  };

  const updateRule = (ruleIdx: number, partial: Partial<RuleFormValue>) => {
    onChange(rules.map((r, i) => (i === ruleIdx ? { ...r, ...partial } : r)));
  };

  const addCondition = (ruleIdx: number) => {
    const rule = rules[ruleIdx];
    const newCond: RuleConditionFormValue = {
      conditionTypeId: '',
      operator: 'EQ',
      value: '',
      logicalOperator: 'AND',
      order: rule.conditions.length,
    };
    updateRule(ruleIdx, { conditions: [...rule.conditions, newCond] });
  };

  const removeCondition = (ruleIdx: number, condIdx: number) => {
    const rule = rules[ruleIdx];
    const newConditions = rule.conditions
      .filter((_, i) => i !== condIdx)
      .map((c, i) => ({ ...c, order: i }));
    updateRule(ruleIdx, { conditions: newConditions });
  };

  const updateCondition = (ruleIdx: number, condIdx: number, partial: Partial<RuleConditionFormValue>) => {
    const rule = rules[ruleIdx];
    updateRule(ruleIdx, {
      conditions: rule.conditions.map((c, i) => (i === condIdx ? { ...c, ...partial } : c)),
    });
  };

  const getConditionType = (id: string) => conditionTypes.find((ct) => ct.id === id);

  const renderValueInput = (conditionTypeId: string, value: string, onChange: (v: string) => void) => {
    const ct = getConditionType(conditionTypeId);
    if (!ct) return <input type="text" className="input" value={value} onChange={(e) => onChange(e.target.value)} placeholder="Valor" />;

    if (ct.key === 'membership_plan') {
      return (
        <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">Seleccioná plan...</option>
          {membershipPlans.map((mp) => (
            <option key={mp.id} value={mp.id}>{mp.name}</option>
          ))}
        </select>
      );
    }

    if (ct.key === 'sex') {
      return (
        <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">Seleccioná...</option>
          {SEX_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      );
    }

    if (ct.dataType === 'NUMBER') {
      return (
        <input
          type="number"
          className="input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Valor numérico"
        />
      );
    }

    return (
      <input
        type="text"
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Valor"
      />
    );
  };

  if (ctLoading) {
    return <div className="flex items-center gap-2 py-4"><Spinner size="sm" /><span className="text-sm text-gray-500">Cargando tipos de condición...</span></div>;
  }

  return (
    <div className="space-y-4">
      {rules.length === 0 && (
        <p className="text-sm text-gray-400 italic">Sin reglas de acceso — el horario está abierto a todos.</p>
      )}

      {rules.map((rule, ruleIdx) => (
        <div key={ruleIdx} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-gray-700">Regla {ruleIdx + 1}</span>
            <button type="button" onClick={() => removeRule(ruleIdx)} className="p-1 text-gray-400 hover:text-red-500">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="label text-xs">Puede reservar</label>
              <label className="flex items-center gap-2 cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={rule.canBook}
                  onChange={(e) => updateRule(ruleIdx, { canBook: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{rule.canBook ? 'Sí puede reservar' : 'No puede reservar'}</span>
              </label>
            </div>
            <div>
              <label className="label text-xs">Precio base ($)</label>
              <input
                type="number"
                min={0}
                step={0.01}
                className="input"
                value={rule.basePrice}
                onChange={(e) => updateRule(ruleIdx, { basePrice: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="label text-xs">Revenue management</label>
              <label className="flex items-center gap-2 cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={rule.revenueManagementEnabled}
                  onChange={(e) => updateRule(ruleIdx, { revenueManagementEnabled: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Habilitado</span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Condiciones</div>
            {rule.conditions.map((cond, condIdx) => {
              const ct = getConditionType(cond.conditionTypeId);
              const allowedOps = ct?.allowedOperators ?? ['EQ', 'NEQ', 'GT', 'GTE', 'LT', 'LTE'];

              return (
                <div key={condIdx} className="flex items-start gap-2 bg-white rounded border border-gray-200 p-3">
                  {condIdx > 0 && (
                    <select
                      className="input w-20 text-xs"
                      value={cond.logicalOperator}
                      onChange={(e) => updateCondition(ruleIdx, condIdx, { logicalOperator: e.target.value })}
                    >
                      <option value="AND">AND</option>
                      <option value="OR">OR</option>
                    </select>
                  )}
                  {condIdx === 0 && <div className="w-20 flex-shrink-0" />}

                  <select
                    className="input flex-1 min-w-0"
                    value={cond.conditionTypeId}
                    onChange={(e) => updateCondition(ruleIdx, condIdx, { conditionTypeId: e.target.value, value: '' })}
                  >
                    <option value="">Condición...</option>
                    {conditionTypes.map((ct) => (
                      <option key={ct.id} value={ct.id}>{ct.name}</option>
                    ))}
                  </select>

                  <select
                    className="input w-36 flex-shrink-0"
                    value={cond.operator}
                    onChange={(e) => updateCondition(ruleIdx, condIdx, { operator: e.target.value })}
                  >
                    {allowedOps.map((op) => (
                      <option key={op} value={op}>{OPERATOR_LABELS[op] ?? op}</option>
                    ))}
                  </select>

                  <div className="flex-1 min-w-0">
                    {renderValueInput(
                      cond.conditionTypeId,
                      cond.value,
                      (v) => updateCondition(ruleIdx, condIdx, { value: v }),
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeCondition(ruleIdx, condIdx)}
                    className="p-1.5 text-gray-400 hover:text-red-500 flex-shrink-0"
                    title="Eliminar condición"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}

            <button
              type="button"
              onClick={() => addCondition(ruleIdx)}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Agregar condición
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addRule}
        className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Agregar regla de acceso
      </button>
    </div>
  );
}
