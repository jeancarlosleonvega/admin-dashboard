import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Users, Ban } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { slotsApi } from '@/api/slots.api';
import type { AgendaColumn, AgendaSlot } from '@/api/slots.api';
import { useBlockedPeriods } from '@/hooks/queries/useBlockedPeriods';
import { Spinner } from '@components/ui/Spinner';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const todayStr = toDateStr(new Date());

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function isoWeekday(d: Date) { return (d.getDay() + 6) % 7; }

// ─── Calendario grande ────────────────────────────────────────────────────────

interface CalendarProps {
  selected: string;
  onSelect: (d: string) => void;
  viewYear: number;
  viewMonth: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  availMap: Record<string, { available: number; blocked: number }>;
  fullBlockedMap: Record<string, string>;
  partialBlockedMap: Record<string, unknown[]>;
}

function BigCalendar({
  selected, onSelect,
  viewYear, viewMonth, onPrevMonth, onNextMonth,
  availMap, fullBlockedMap, partialBlockedMap,
}: CalendarProps) {
  const firstDay = new Date(viewYear, viewMonth, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startPad = isoWeekday(firstDay);

  function cellDate(day: number) {
    return `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  return (
    <div className="card p-6">
      {/* Nav */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={onPrevMonth} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ChevronLeft className="w-4 h-4 text-gray-500" />
        </button>
        <span className="text-sm font-semibold text-gray-800">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button onClick={onNextMonth} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ChevronRight className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-2">
        {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'].map((d) => (
          <div key={d} className="text-center text-sm font-semibold text-gray-400 pb-2">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startPad }).map((_, i) => <div key={`p${i}`} />)}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const ds = cellDate(day);
          const isSelected = ds === selected;
          const isToday = ds === todayStr;
          const isFull = ds in fullBlockedMap;
          const isPartial = !isFull && ds in partialBlockedMap;
          const avail = availMap[ds];

          return (
            <button
              key={ds}
              onClick={() => onSelect(ds)}
              className={`
                relative flex flex-col items-center justify-center rounded-xl py-4 transition-colors
                ${isSelected
                  ? isFull
                    ? 'bg-red-600 text-white'
                    : 'bg-primary-600 text-white'
                  : isFull
                    ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                    : isToday
                      ? 'border-2 border-primary-400 text-primary-700 hover:bg-primary-50'
                      : 'hover:bg-gray-50 text-gray-700'}
              `}
            >
              <span className="text-base font-semibold leading-none">{day}</span>

              {isFull && !isSelected && <Ban className="w-3 h-3 mt-1 text-red-400" />}
              {isFull && isSelected && <Ban className="w-3 h-3 mt-1 text-white/70" />}

              {isPartial && (
                <span className={`w-1.5 h-1.5 mt-1 rounded-full block ${isSelected ? 'bg-white/70' : 'bg-orange-400'}`} />
              )}

              {!isFull && !isPartial && avail != null && avail.available > 0 && (
                <span className={`text-xs mt-1.5 leading-none font-semibold ${isSelected ? 'text-white/80' : 'text-green-600'}`}>
                  {avail.available}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-5 text-[11px] text-gray-400">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-red-100 border border-red-200 inline-block" /> Día completo
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" /> Rango parcial
        </span>
        <span className="flex items-center gap-1">
          <span className="text-green-600 font-bold">N</span> Disponibles
        </span>
      </div>

      {selected !== todayStr && (
        <button
          onClick={() => onSelect(todayStr)}
          className="mt-4 w-full text-xs text-primary-600 hover:text-primary-700 font-medium text-center"
        >
          Ir a hoy
        </button>
      )}
    </div>
  );
}

// ─── Celdas del timeline ──────────────────────────────────────────────────────

function SlotCell({ slot }: { slot: AgendaSlot | undefined }) {
  if (!slot) {
    return <td className="border border-gray-100 p-3 bg-gray-50/30" />;
  }

  if (slot.status === 'BLOCKED') {
    return (
      <td className="border border-gray-100 p-3 bg-gray-100">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-gray-400 flex-shrink-0" />
          <span className="text-xs text-gray-500">Bloqueado</span>
        </span>
      </td>
    );
  }

  if (slot.status === 'BOOKED' && slot.booking) {
    return (
      <td className="border border-gray-100 p-3 bg-blue-50">
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
            <span className="text-xs font-semibold text-blue-800 truncate">{slot.booking.userName}</span>
          </span>
          <div className="flex items-center gap-2 pl-3.5">
            {slot.booking.numPlayers > 1 && (
              <span className="flex items-center gap-0.5 text-[10px] text-blue-400">
                <Users className="w-2.5 h-2.5" />{slot.booking.numPlayers}
              </span>
            )}
            {slot.scheduleName && (
              <span className="text-[10px] text-blue-400 truncate">{slot.scheduleName}</span>
            )}
          </div>
        </div>
      </td>
    );
  }

  const hasCond = !!slot.conditions;
  return (
    <td className={`border border-gray-100 p-3 ${hasCond ? 'bg-amber-50/50' : ''}`}>
      <span className="flex items-center gap-1.5 min-w-0">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${hasCond ? 'bg-amber-400' : 'bg-green-400'}`} />
        <span className={`text-xs font-medium flex-shrink-0 ${hasCond ? 'text-amber-700' : 'text-green-700'}`}>
          {slot.scheduleName ?? 'Disponible'}
        </span>
        {slot.conditions && (
          <>
            <span className="text-gray-300 flex-shrink-0">·</span>
            <span className="text-[10px] text-amber-600 truncate">{slot.conditions}</span>
          </>
        )}
      </span>
    </td>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function AgendaPage() {
  const [date, setDate] = useState(todayStr);
  const [viewYear, setViewYear] = useState(() => Number(todayStr.split('-')[0]));
  const [viewMonth, setViewMonth] = useState(() => Number(todayStr.split('-')[1]) - 1);

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11); }
    else setViewMonth(viewMonth - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0); }
    else setViewMonth(viewMonth + 1);
  }

  // Sync calendar view when selecting a date from outside
  function handleSelect(d: string) {
    setDate(d);
    const [y, m] = d.split('-').map(Number);
    setViewYear(y);
    setViewMonth(m - 1);
  }

  const startDate = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-01`;
  const endDate = toDateStr(new Date(viewYear, viewMonth + 1, 0));

  // Monthly slot availability
  const { data: monthData } = useQuery({
    queryKey: ['agenda-month', startDate, endDate],
    queryFn: () => slotsApi.getAgendaMonthAvailability(startDate, endDate),
    staleTime: 60_000,
  });

  const availMap = useMemo(() => {
    const m: Record<string, { available: number; blocked: number }> = {};
    for (const d of monthData ?? []) m[d.date] = { available: d.available, blocked: d.blocked };
    return m;
  }, [monthData]);

  // Blocked periods for the month
  const { data: blockedData } = useBlockedPeriods({ startDate, endDate });

  const { fullBlockedMap, partialBlockedMap } = useMemo(() => {
    const full: Record<string, string> = {};
    const partial: Record<string, { reason: string; startTime: string; endTime: string }[]> = {};
    for (const bp of blockedData?.data ?? []) {
      if (!bp.active) continue;
      const cur = new Date(bp.startDate.slice(0, 10) + 'T12:00:00');
      const end = new Date(bp.endDate.slice(0, 10) + 'T12:00:00');
      while (cur <= end) {
        const ds = toDateStr(cur);
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
  }, [blockedData?.data]);

  // Day agenda data
  const { data, isLoading, isError } = useQuery({
    queryKey: ['agenda', date],
    queryFn: () => slotsApi.getAgenda(date),
    staleTime: 30_000,
  });

  const slotMap = useMemo(() => {
    const m = new Map<string, AgendaSlot>();
    for (const s of data?.slots ?? []) m.set(`${s.venueId}__${s.startTime}`, s);
    return m;
  }, [data]);

  const isFullBlocked = date in fullBlockedMap;
  const fullBlockReason = fullBlockedMap[date];
  const partialBlocks = partialBlockedMap[date] ?? [];

  const totalAvailable = data?.slots.filter((s) => s.status === 'AVAILABLE').length ?? 0;
  const totalBooked = data?.slots.filter((s) => s.status === 'BOOKED').length ?? 0;
  const totalBlocked = data?.slots.filter((s) => s.status === 'BLOCKED').length ?? 0;
  const totalSlots = (data?.slots.length ?? 0);

  const [dy, dm, dd] = date.split('-').map(Number);
  const displayDate = new Date(dy, dm - 1, dd).toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="flex gap-5 items-start">

      {/* ── Izquierda: calendario ── */}
      <div className="w-[520px] flex-shrink-0">
        <BigCalendar
          selected={date}
          onSelect={handleSelect}
          viewYear={viewYear}
          viewMonth={viewMonth}
          onPrevMonth={prevMonth}
          onNextMonth={nextMonth}
          availMap={availMap}
          fullBlockedMap={fullBlockedMap}
          partialBlockedMap={partialBlockedMap}
        />
      </div>

      {/* ── Derecha: timeline ── */}
      <div className="flex-1 min-w-0 space-y-3">

        {/* Cabecera */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900 capitalize">{displayDate}</h2>
          {!isFullBlocked && totalSlots > 0 && (
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span><span className="font-semibold text-gray-900">{totalSlots}</span> total</span>
              <span><span className="font-semibold text-green-600">{totalAvailable}</span> disp.</span>
              <span><span className="font-semibold text-blue-600">{totalBooked}</span> res.</span>
              {totalBlocked > 0 && <span><span className="font-semibold text-red-500">{totalBlocked}</span> bloq.</span>}
            </div>
          )}
        </div>

        {/* Día completamente bloqueado */}
        {isFullBlocked && (
          <div className="card px-6 py-16 text-center">
            <Ban className="w-12 h-12 text-red-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-red-600">Este día está bloqueado</p>
            {fullBlockReason && <p className="text-xs mt-1 text-gray-500">{fullBlockReason}</p>}
          </div>
        )}

        {/* Timeline (día no completamente bloqueado) */}
        {!isFullBlocked && (
          <>
            {/* Banner de franjas bloqueadas */}
            {partialBlocks.length > 0 && (
              <div className="rounded-lg bg-orange-50 border border-orange-200 px-4 py-3">
                <p className="text-xs font-semibold text-orange-700 mb-1">Franjas horarias bloqueadas:</p>
                {partialBlocks.map((pb, i) => (
                  <p key={i} className="text-xs text-orange-600">
                    {pb.startTime} — {pb.endTime}
                    {pb.reason && <span className="text-orange-400"> · {pb.reason}</span>}
                  </p>
                ))}
              </div>
            )}

            {isLoading && <div className="flex justify-center py-16"><Spinner size="lg" /></div>}
            {isError && <div className="text-center py-16 text-red-500 text-sm">Error al cargar la agenda</div>}

            {!isLoading && !isError && data && data.columns.length === 0 && (
              <div className="card p-12 text-center">
                <p className="text-sm text-gray-400">No hay turnos generados para este día</p>
              </div>
            )}

            {!isLoading && !isError && data && data.columns.length > 0 && (
              <div className="card overflow-hidden">
                {/* Leyenda */}
                <div className="flex items-center gap-4 px-4 py-2.5 border-b border-gray-100 bg-gray-50/50 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-400" />Disponible</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" />Con condiciones</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" />Reservado</span>
                  {totalBlocked > 0 && <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-400" />Bloqueado</span>}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="border border-gray-200 px-3 py-2.5 bg-gray-50 text-left sticky left-0 z-10 w-20">
                          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Hora</span>
                        </th>
                        {data.columns.map((col: AgendaColumn) => (
                          <th key={col.venueId} className="border border-gray-200 px-3 py-2.5 bg-gray-50 text-left">
                            <span className="text-xs font-semibold text-gray-700">{col.venueName}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.hours.map((hour: string) => (
                        <tr key={hour} className="hover:bg-blue-50/10 transition-colors">
                          <td className="border border-gray-100 px-3 py-2.5 bg-white sticky left-0 z-10 w-20">
                            <span className="text-xs font-semibold text-gray-600 tabular-nums">{hour}</span>
                          </td>
                          {data.columns.map((col: AgendaColumn) => (
                            <SlotCell
                              key={`${col.venueId}__${hour}`}
                              slot={slotMap.get(`${col.venueId}__${hour}`)}
                            />
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
}
