import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePageHeader } from '@/hooks/usePageHeader';
import { ArrowLeft, Ban, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { useVenueSchedule } from '@/hooks/queries/useVenueSchedules';
import { useSlots, useSlotAvailability } from '@/hooks/queries/useSlots';
import { useBlockedPeriods } from '@/hooks/queries/useBlockedPeriods';
import { Spinner } from '@components/ui/Spinner';

const DAY_NAMES: Record<number, string> = {
  1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 7: 'Domingo',
};

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

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

  const { data: availability } = useSlotAvailability(schedule?.venueId ?? '', startDate, endDate);
  const { data: slots, isLoading: slotsLoading } = useSlots(schedule?.venueId ?? '', selectedDate);

  // Períodos bloqueados del mes visible — sin filtro de venue para incluir bloques globales
  const { data: blockedData } = useBlockedPeriods({ startDate, endDate });
  // Mapa date → availableSlots
  const availabilityMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const d of availability ?? []) map[d.date] = d.availableSlots;
    return map;
  }, [availability]);

  // Conjunto de fechas bloqueadas → razón (del primer período que aplique)
  const blockedDatesMap = useMemo(() => {
    const map: Record<string, string> = {};
    const venueId = schedule?.venueId;
    const sportTypeId = schedule?.venue?.sportType?.id;
    for (const bp of blockedData?.data ?? []) {
      if (!bp.active) continue;
      // Solo incluir bloques que apliquen: global, por deporte o por espacio específico
      const applies = (!bp.venueId && !bp.sportTypeId)
        || bp.venueId === venueId
        || (bp.sportTypeId && bp.sportTypeId === sportTypeId);
      if (!applies) continue;
      // Usar solo la parte de fecha para evitar desfase de timezone
      const cur = new Date(bp.startDate.slice(0, 10) + 'T12:00:00');
      const end = new Date(bp.endDate.slice(0, 10) + 'T12:00:00');
      while (cur <= end) {
        const ds = toLocalDateString(cur);
        if (!map[ds]) map[ds] = bp.reason || 'Período bloqueado';
        cur.setDate(cur.getDate() + 1);
      }
    }
    return map;
  }, [blockedData?.data, schedule?.venueId, schedule?.venue?.sportType?.id]);

  const calendarDays = useMemo(() => {
    const first = new Date(calendarMonth.year, calendarMonth.month, 1);
    const startPad = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(calendarMonth.year, calendarMonth.month + 1, 0).getDate();
    return { startPad, daysInMonth };
  }, [calendarMonth]);

  const todayStr = toLocalDateString(today);

  const isBlockedDay = selectedDate in blockedDatesMap;
  const blockReason = blockedDatesMap[selectedDate];

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

  // Jugadores efectivos: schedule → venue → sportType
  const effectivePlayers = schedule.playersPerSlot ?? schedule.venue?.playersPerSlot ?? schedule.venue?.sportType?.defaultPlayersPerSlot;

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
      <div className="card p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{schedule.name}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Espacio</p>
            <p className="text-sm text-gray-900">{schedule.venue?.name ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Deporte</p>
            <p className="text-sm text-gray-900">{schedule.venue?.sportType?.name ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Estado</p>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${schedule.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
              {schedule.active ? 'Activo' : 'Inactivo'}
            </span>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Jugadores por turno</p>
            <p className="text-sm text-gray-900">
              {effectivePlayers ?? '—'}
              {schedule.playersPerSlot == null && effectivePlayers != null && (
                <span className="ml-1 text-xs text-gray-400">(heredado)</span>
              )}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Horario</p>
            <p className="text-sm text-gray-900">
              {schedule.openTime && schedule.closeTime ? `${schedule.openTime} — ${schedule.closeTime}` : 'Por defecto'}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Intervalo</p>
            <p className="text-sm text-gray-900">
              {schedule.intervalMinutes ? `${schedule.intervalMinutes} min` : 'Por defecto'}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Generado hasta</p>
            <p className="text-sm text-gray-900">
              {schedule.generatedUntil ? new Date(schedule.generatedUntil).toLocaleDateString('es-AR') : '—'}
            </p>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Días</p>
            <div className="flex flex-wrap gap-1">
              {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                <span
                  key={d}
                  className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                    schedule.daysOfWeek.includes(d) ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {DAY_NAMES[d].slice(0, 2)}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Calendario + Slots */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

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

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: calendarDays.startPad }).map((_, i) => (
              <div key={`pad-${i}`} />
            ))}
            {Array.from({ length: calendarDays.daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${calendarMonth.year}-${String(calendarMonth.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const count = availabilityMap[dateStr];
              const isSelected = dateStr === selectedDate;
              const isToday = dateStr === todayStr;
              const isBlocked = dateStr in blockedDatesMap;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`relative flex flex-col items-center justify-center rounded-lg py-1.5 text-sm transition-colors ${
                    isSelected
                      ? isBlocked
                        ? 'bg-red-600 text-white'
                        : 'bg-primary-600 text-white'
                      : isBlocked
                      ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                      : isToday
                      ? 'border border-primary-300 text-primary-700 hover:bg-primary-50'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                  title={isBlocked ? blockedDatesMap[dateStr] : undefined}
                >
                  <span className="font-medium leading-none">{day}</span>
                  {isBlocked && !isSelected && (
                    <Ban className="w-2.5 h-2.5 mt-0.5 text-red-400" />
                  )}
                  {!isBlocked && count != null && (
                    <span className={`text-[10px] mt-0.5 leading-none font-medium ${isSelected ? 'text-primary-100' : 'text-green-600'}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-4 mt-3 text-xs text-gray-400 justify-center">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-100 border border-red-200 inline-block" /> Bloqueado</span>
            <span className="flex items-center gap-1"><span className="text-green-600 font-semibold">N</span> Disponibles</span>
          </div>
        </div>

        {/* Panel de turnos */}
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h3>
            {!isBlockedDay && (
              <div className="flex gap-3 text-xs text-gray-500">
                <span><span className="font-semibold text-gray-900">{total}</span> total</span>
                <span><span className="font-semibold text-green-600">{available}</span> disp.</span>
                <span><span className="font-semibold text-blue-600">{booked}</span> res.</span>
                {blocked > 0 && <span><span className="font-semibold text-red-500">{blocked}</span> bloq.</span>}
              </div>
            )}
          </div>

          {isBlockedDay ? (
            <div className="px-6 py-16 text-center text-red-400">
              <Ban className="w-10 h-10 mx-auto mb-3 opacity-60" />
              <p className="text-sm font-medium text-red-600">Este día está bloqueado</p>
              <p className="text-xs mt-1 text-gray-500">{blockReason}</p>
            </div>
          ) : slotsLoading ? (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          ) : !slots || slots.length === 0 ? (
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Horario</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {slots.map((slot) => (
                    <tr key={slot.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {slot.startTime} — {slot.endTime}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${STATUS_CLASS[slot.status] ?? 'bg-gray-100 text-gray-700'}`}>
                          {STATUS_LABEL[slot.status] ?? slot.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
