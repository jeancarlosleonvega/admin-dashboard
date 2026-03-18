import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePageHeader } from '@/hooks/usePageHeader';
import { ArrowLeft, Ban, ChevronLeft, ChevronRight, Clock, Pencil, ShieldCheck } from 'lucide-react';
import { useVenueSchedule } from '@/hooks/queries/useVenueSchedules';
import { useSlots, useSlotAvailability } from '@/hooks/queries/useSlots';
import { useBlockedPeriods } from '@/hooks/queries/useBlockedPeriods';
import { useMembershipPlans } from '@/hooks/queries/useMembershipPlans';
import { Spinner } from '@components/ui/Spinner';
import { formatDate, formatDateLong } from '@lib/formatDate';
import type { ScheduleTimeRange } from '@/types/venue-schedule.types';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

import { OPERATOR_LABELS } from '@lib/operatorLabels';

const STATUS_LABEL: Record<string, string> = {
  AVAILABLE: 'Disponible',
  BOOKED: 'Reservado',
  BLOCKED: 'Bloqueado',
};

const STATUS_CLASS: Record<string, string> = {
  AVAILABLE: 'bg-green-100 text-green-700',
  BOOKED: 'bg-blue-100 text-blue-700',
  BLOCKED: 'bg-red-100 text-red-700',
};

function toLocalDateString(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function SlotsViewPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const scheduleId = searchParams.get('scheduleId') ?? '';

  const today = new Date();
  const [calendarMonth, setCalendarMonth] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [selectedDate, setSelectedDate] = useState(toLocalDateString(today));

  const { data: schedule, isLoading: scheduleLoading } = useVenueSchedule(scheduleId);

  usePageHeader({ subtitle: schedule?.name ?? 'Ver turnos del horario' });

  const { startDate, endDate } = useMemo(() => {
    const first = new Date(calendarMonth.year, calendarMonth.month, 1);
    const last = new Date(calendarMonth.year, calendarMonth.month + 1, 0);
    return { startDate: toLocalDateString(first), endDate: toLocalDateString(last) };
  }, [calendarMonth]);

  const { data: availability } = useSlotAvailability(
    schedule?.venueId ?? '',
    startDate,
    endDate,
    scheduleId || undefined,
  );
  const { data: slots, isLoading: slotsLoading } = useSlots(schedule?.venueId ?? '', selectedDate, scheduleId || undefined);

  // Períodos bloqueados del mes visible — sin filtro de venue para incluir bloques globales
  const { data: blockedData } = useBlockedPeriods({ startDate, endDate });
  const { data: plansData } = useMembershipPlans({ active: 'true', limit: 100 });
  const membershipPlans = plansData?.data ?? [];
  // Mapa date → availableSlots
  const availabilityMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const d of availability ?? []) map[d.date] = d.availableSlots;
    return map;
  }, [availability]);

  // Separar bloqueos totales (sin horario) de parciales (con horario)
  const { fullBlockedMap, partialBlockedMap } = useMemo(() => {
    const full: Record<string, string> = {};
    const partial: Record<string, { reason: string; startTime: string; endTime: string }[]> = {};
    const venueId = schedule?.venueId;
    const sportTypeId = schedule?.venue?.sportType?.id;
    for (const bp of blockedData?.data ?? []) {
      if (!bp.active) continue;
      const applies = (!bp.venueId && !bp.sportTypeId)
        || bp.venueId === venueId
        || (bp.sportTypeId && bp.sportTypeId === sportTypeId);
      if (!applies) continue;
      const cur = new Date(bp.startDate.slice(0, 10) + 'T12:00:00');
      const end = new Date(bp.endDate.slice(0, 10) + 'T12:00:00');
      while (cur <= end) {
        const ds = toLocalDateString(cur);
        if (bp.startTime && bp.endTime) {
          if (!partial[ds]) partial[ds] = [];
          partial[ds].push({ reason: bp.reason || 'Período bloqueado', startTime: bp.startTime, endTime: bp.endTime });
        } else {
          if (!full[ds]) full[ds] = bp.reason || 'Período bloqueado';
        }
        cur.setDate(cur.getDate() + 1);
      }
    }
    return { fullBlockedMap: full, partialBlockedMap: partial };
  }, [blockedData?.data, schedule?.venueId, schedule?.venue?.sportType?.id]);

  const calendarDays = useMemo(() => {
    const first = new Date(calendarMonth.year, calendarMonth.month, 1);
    const startPad = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(calendarMonth.year, calendarMonth.month + 1, 0).getDate();
    return { startPad, daysInMonth };
  }, [calendarMonth]);

  const todayStr = toLocalDateString(today);

  const isFullyBlocked = selectedDate in fullBlockedMap;
  const fullBlockReason = fullBlockedMap[selectedDate];
  const partialBlocks = partialBlockedMap[selectedDate] ?? [];

  const total = slots?.length ?? 0;
  const available = slots?.filter((s) => s.status === 'AVAILABLE').length ?? 0;
  const booked = slots?.filter((s) => s.status === 'BOOKED').length ?? 0;
  const blocked = slots?.filter((s) => s.status === 'BLOCKED').length ?? 0;

  if (scheduleLoading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }

  if (!schedule) {
    return <div className="text-center py-20 text-gray-400"><p>No se encontró el horario.</p></div>;
  }

  // Jugadores efectivos: tomar del primer timeRange activo
  const firstActiveTimeRange = schedule.timeRanges?.find((tr) => tr.active);
  const effectivePlayers = firstActiveTimeRange?.playersPerSlot ?? null;

  // Mapear cada slot al timeRange correspondiente según su startTime
  const slotTimeRangeMap = useMemo(() => {
    if (!schedule?.timeRanges || !slots) return {} as Record<string, { tr: ScheduleTimeRange; index: number }>;
    const result: Record<string, { tr: ScheduleTimeRange; index: number }> = {};
    for (const slot of slots) {
      const idx = schedule.timeRanges.findIndex(
        (tr) => slot.startTime >= tr.startTime && slot.startTime < tr.endTime,
      );
      if (idx !== -1) result[slot.id] = { tr: schedule.timeRanges[idx], index: idx };
    }
    return result;
  }, [schedule?.timeRanges, slots]);

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Volver a Horarios
      </button>

      {/* Detalle del horario */}
      <div className="card px-5 py-3 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900">{schedule.name}</h2>
          <button
            onClick={() => navigate(`/horarios/${scheduleId}/editar`)}
            className="btn-secondary flex items-center gap-1.5 text-sm"
          >
            <Pencil className="w-4 h-4" />
            Editar horario
          </button>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-2">
          <div>
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Espacio</p>
            <p className="text-sm text-gray-900">{schedule.venue?.name ?? '—'}</p>
          </div>
          <div>
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Deporte</p>
            <p className="text-sm text-gray-900">{schedule.venue?.sportType?.name ?? '—'}</p>
          </div>
          <div>
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Estado</p>
            <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${schedule.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
              {schedule.active ? 'Activo' : 'Inactivo'}
            </span>
          </div>
          <div>
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Jugadores / turno</p>
            <p className="text-sm text-gray-900">{effectivePlayers ?? '—'}</p>
          </div>
          <div>
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Bloques</p>
            <p className="text-sm text-gray-900">
              {schedule.timeRanges && schedule.timeRanges.length > 0
                ? `${schedule.timeRanges.length} bloque${schedule.timeRanges.length !== 1 ? 's' : ''}`
                : '—'}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Generado hasta</p>
            <p className="text-sm text-gray-900">{formatDate(schedule.generatedUntil)}</p>
          </div>
        </div>
      </div>

      {/* Condiciones de acceso por bloque */}
      {schedule.timeRanges && schedule.timeRanges.some((tr) => (tr.rules ?? []).length > 0) && (
        <div className="card p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-gray-900">Condiciones de acceso por bloque</h3>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <span className="inline-flex px-1.5 py-0.5 text-xs font-semibold rounded bg-green-100 text-green-700">✓ Puede</span>
                <span>= puede reservar</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-flex px-1.5 py-0.5 text-xs rounded bg-purple-100 text-purple-700">RM</span>
                <span>= precio dinámico</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-flex px-1.5 py-0.5 text-xs rounded bg-yellow-50 text-yellow-700 border border-yellow-200">$N</span>
                <span>= precio override</span>
              </span>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {schedule.timeRanges.map((tr, trIdx) => {
              const rules = tr.rules ?? [];
              if (rules.length === 0) return null;
              return (
                <div key={tr.id} className="py-2.5 flex gap-4 items-start">
                  <div className="shrink-0 w-32 pt-0.5">
                    <p className="text-xs font-semibold text-gray-700">B{trIdx + 1} <span className="font-normal text-gray-400">{tr.startTime}–{tr.endTime}</span></p>
                  </div>
                  <div className="flex flex-col gap-2 flex-1 min-w-0">
                    {rules.map((rule, rIdx) => (
                      <div key={rule.id} className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs text-gray-400 shrink-0">R{rIdx + 1}</span>
                        <span className={`inline-flex px-1.5 py-0.5 text-xs font-semibold rounded ${rule.canBook ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {rule.canBook ? '✓ Puede' : '✗ No puede'}
                        </span>
                        {rule.priceOverride != null && (
                          <span className="inline-flex px-1.5 py-0.5 text-xs rounded bg-yellow-50 text-yellow-700 border border-yellow-200">
                            ${rule.priceOverride.toLocaleString()}
                          </span>
                        )}
                        {rule.revenueManagementEnabled && (
                          <span className="inline-flex px-1.5 py-0.5 text-xs rounded bg-purple-100 text-purple-700">RM</span>
                        )}
                        {rule.conditions.map((cond, cIdx) => {
                          const valueLabel = cond.conditionType.key === 'membership_plan'
                            ? (membershipPlans.find((p) => p.id === cond.value)?.name ?? cond.value)
                            : (cond.conditionType.allowedValues ?? []).find((av) => av.value === cond.value)?.label ?? cond.value;
                          return (
                            <span key={cIdx} className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 rounded px-1.5 py-0.5">
                              {cIdx > 0 && <span className="text-blue-500 font-semibold">{cond.logicalOperator}</span>}
                              <span>{cond.conditionType.name}</span>
                              <span className="text-gray-400">{OPERATOR_LABELS[cond.operator] ?? cond.operator}</span>
                              <span className="font-medium">{valueLabel}</span>
                            </span>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Calendario + Slots */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,_1fr)_minmax(0,_1.4fr)] gap-6">

        {/* Calendario */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCalendarMonth((m) => {
                const d = new Date(m.year, m.month - 1, 1);
                return { year: d.getFullYear(), month: d.getMonth() };
              })}
              className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-gray-800">
              {MONTH_NAMES[calendarMonth.month]} {calendarMonth.year}
            </span>
            <button
              onClick={() => setCalendarMonth((m) => {
                const d = new Date(m.year, m.month + 1, 1);
                return { year: d.getFullYear(), month: d.getMonth() };
              })}
              className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'].map((d) => (
              <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: calendarDays.startPad }).map((_, i) => (
              <div key={`pad-${i}`} />
            ))}
            {Array.from({ length: calendarDays.daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${calendarMonth.year}-${String(calendarMonth.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const count = availabilityMap[dateStr];
              const isSelected = dateStr === selectedDate;
              const isToday = dateStr === todayStr;
              const isFullDay = dateStr in fullBlockedMap;
              const isPartial = dateStr in partialBlockedMap;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`relative flex flex-col items-center justify-center rounded py-1 text-xs transition-colors ${
                    isSelected
                      ? isFullDay
                        ? 'bg-red-600 text-white'
                        : 'bg-primary-600 text-white'
                      : isFullDay
                      ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                      : isToday
                      ? 'border border-primary-300 text-primary-700 hover:bg-primary-50'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                  title={isFullDay ? fullBlockedMap[dateStr] : undefined}
                >
                  <span className="font-medium leading-none">{day}</span>
                  {isFullDay && !isSelected && <Ban className="w-2 h-2 mt-0.5 text-red-400" />}
                  {isPartial && !isFullDay && (
                    <span className="w-1 h-1 mt-0.5 rounded-full bg-orange-400 inline-block" />
                  )}
                  {!isFullDay && !isPartial && count != null && (
                    <span className={`text-[9px] mt-0.5 leading-none font-medium ${isSelected ? 'text-primary-100' : 'text-green-600'}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-4 mt-3 text-xs text-gray-400 justify-center">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-100 border border-red-200 inline-block" /> Día completo</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400 inline-block" /> Rango parcial</span>
            <span className="flex items-center gap-1"><span className="text-green-600 font-semibold">N</span> Disponibles</span>
          </div>
        </div>

        {/* Panel de turnos */}
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">
              {formatDateLong(selectedDate)}
            </h3>
            {!isFullyBlocked && (
              <div className="flex gap-3 text-xs text-gray-500">
                <span><span className="font-semibold text-gray-900">{total}</span> total</span>
                <span><span className="font-semibold text-green-600">{available}</span> disp.</span>
                <span><span className="font-semibold text-blue-600">{booked}</span> res.</span>
                {blocked > 0 && <span><span className="font-semibold text-red-500">{blocked}</span> bloq.</span>}
              </div>
            )}
          </div>

          {isFullyBlocked ? (
            <div className="px-6 py-16 text-center text-red-400">
              <Ban className="w-10 h-10 mx-auto mb-3 opacity-60" />
              <p className="text-sm font-medium text-red-600">Este día está bloqueado</p>
              <p className="text-xs mt-1 text-gray-500">{fullBlockReason}</p>
            </div>
          ) : slotsLoading ? (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          ) : (
            <>
              {partialBlocks.length > 0 && (
                <div className="mx-4 mt-3 mb-1 rounded-lg bg-orange-50 border border-orange-200 px-3 py-2">
                  <p className="text-xs font-semibold text-orange-700 mb-1">Franjas horarias bloqueadas:</p>
                  {partialBlocks.map((pb, i) => (
                    <p key={i} className="text-xs text-orange-600">
                      {pb.startTime} — {pb.endTime}
                      {pb.reason ? <span className="text-orange-400"> · {pb.reason}</span> : null}
                    </p>
                  ))}
                </div>
              )}
              {!slots || slots.length === 0 ? (
                <div className="px-6 py-16 text-center text-gray-400">
                  <Clock className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No hay turnos generados para este día</p>
                  <p className="text-xs mt-1">Generá turnos desde la vista de Horarios</p>
                </div>
              ) : (
                <div className="overflow-y-auto max-h-96">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                      <tr>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Horario</th>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bloque</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {slots.map((slot) => {
                        const match = slotTimeRangeMap[slot.id];
                        const hasRules = (match?.tr.rules ?? []).length > 0;
                        return (
                          <tr key={slot.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2.5 text-sm font-medium text-gray-900">
                              {slot.startTime} — {slot.endTime}
                            </td>
                            <td className="px-4 py-2.5">
                              <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${STATUS_CLASS[slot.status] ?? 'bg-gray-100 text-gray-700'}`}>
                                {STATUS_LABEL[slot.status] ?? slot.status}
                              </span>
                            </td>
                            <td className="px-4 py-2.5">
                              {match ? (
                                <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                                  <span className="font-semibold">B{match.index + 1}</span>
                                  {hasRules && (
                                    <ShieldCheck className="w-3 h-3 text-blue-500" title={`${match.tr.rules!.length} regla${match.tr.rules!.length !== 1 ? 's' : ''}`} />
                                  )}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-300">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
