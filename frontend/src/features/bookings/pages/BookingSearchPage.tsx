import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageHeader } from '@/hooks/usePageHeader';
import { useSearchSlots } from '@/hooks/queries/useSlots';
import { useVenues } from '@/hooks/queries/useVenues';
import { Spinner } from '@components/ui/Spinner';
import {
  LayoutGrid,
  List,
  Clock,
  Users,
  MapPin,
} from 'lucide-react';
import type { SlotAvailability } from '@/types/venue-schedule.types';
import { formatDateLong, formatDateShort } from '@lib/formatDate';

function toISODate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function BookingSearchPage() {
  usePageHeader({ subtitle: 'Nueva reserva' });

  const navigate = useNavigate();
  const today = toISODate(new Date());

  // Toolbar state
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(() => addDays(today, 7));
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [venueId, setVenueId] = useState('');
  const [numPlayers, setNumPlayers] = useState(4);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  const handleSelectSlot = (slot: SlotAvailability) => {
    navigate('/reservas/nueva/confirmar', { state: { slot, numPlayers } });
  };

  const { data: venuesData } = useVenues({ active: 'true', limit: 100 });
  const venues = venuesData?.data ?? [];

  // Debounce solo en campos de texto (hora) para no disparar un fetch por tecla
  const [debouncedStartTime, setDebouncedStartTime] = useState('');
  const [debouncedEndTime, setDebouncedEndTime] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedStartTime(startTime), 400);
    return () => clearTimeout(t);
  }, [startTime]);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedEndTime(endTime), 400);
    return () => clearTimeout(t);
  }, [endTime]);

  // Fecha, cancha y jugadores son cambios discretos → inmediatos (sin debounce)
  const searchParams = useMemo(
    () => ({
      startDate,
      endDate: endDate || undefined,
      venueId: venueId || undefined,
      startTime: debouncedStartTime || undefined,
      endTime: debouncedEndTime || undefined,
      numPlayers: numPlayers,
    }),
    [startDate, endDate, venueId, debouncedStartTime, debouncedEndTime, numPlayers],
  );

  const { data: slotsData, isLoading, isFetching } = useSearchSlots(searchParams, !!startDate);

  // Group by date → venue for card view
  const slotsByDateAndVenue = useMemo(() => {
    const dateMap = new Map<string, Map<string, SlotAvailability[]>>();
    for (const s of slotsData ?? []) {
      const dateKey = s.date.slice(0, 10);
      const venueKey = s.venueId ?? s.venue?.id ?? 'unknown';
      if (!dateMap.has(dateKey)) dateMap.set(dateKey, new Map());
      const venueMap = dateMap.get(dateKey)!;
      if (!venueMap.has(venueKey)) venueMap.set(venueKey, []);
      venueMap.get(venueKey)!.push(s);
    }
    return dateMap;
  }, [slotsData]);

  const resultDates = Array.from(slotsByDateAndVenue.keys());
  const firstResultDate = resultDates[0];
  const lastResultDate = resultDates[resultDates.length - 1];
  const isMultiDate = resultDates.length > 1;

  const isRange = isMultiDate;
  const rangeLabel = isMultiDate
    ? `${formatDateShort(firstResultDate)} — ${formatDateShort(lastResultDate)}`
    : firstResultDate
    ? formatDateLong(firstResultDate)
    : startDate
    ? formatDateLong(startDate)
    : '';

  const maxEndDate = startDate ? addDays(startDate, 30) : '';

  const handleStartDateChange = (val: string) => {
    if (!val) return;
    setStartDate(val);
    // Auto-setear fecha hasta a 1 semana después, respetando el máximo de 1 mes
    const autoEnd = addDays(val, 7);
    setEndDate(autoEnd);
  };

  const handleEndDateChange = (val: string) => {
    if (!val) { setEndDate(''); return; }
    // No permitir más de 1 mes desde fecha desde
    if (maxEndDate && val > maxEndDate) setEndDate(maxEndDate);
    else setEndDate(val);
  };

  return (
    <div className="space-y-5">
      {/* Search toolbar */}
      <div className="card p-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4 items-end">
          {/* Fecha desde */}
          <div className="col-span-1">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Fecha desde
            </label>
            <input
              type="date"
              value={startDate}
              min={today}
              onChange={(e) => handleStartDateChange(e.target.value)}
              className="input"
            />
          </div>

          {/* Fecha hasta */}
          <div className="col-span-1">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Fecha hasta
            </label>
            <input
              type="date"
              value={endDate}
              min={startDate || today}
              max={maxEndDate}
              onChange={(e) => handleEndDateChange(e.target.value)}
              className="input"
            />
          </div>

          {/* Hora desde */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Hora desde
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="input"
            />
          </div>

          {/* Hora hasta */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Hora hasta
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="input"
            />
          </div>

          {/* Jugadores */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Jugadores
            </label>
            <select
              value={numPlayers}
              onChange={(e) => setNumPlayers(Number(e.target.value))}
              className="input"
            >
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? 'jugador' : 'jugadores'}
                </option>
              ))}
            </select>
          </div>

          {/* Cancha */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Cancha
            </label>
            <select
              value={venueId}
              onChange={(e) => setVenueId(e.target.value)}
              className="input"
            >
              <option value="">Todas</option>
              {venues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          {/* Indicador de carga */}
          <div className="flex items-end pb-0.5">
            {isFetching && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Spinner size="sm" />
                Buscando...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      <div>
          {/* Results header */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-gray-800 capitalize">{rangeLabel}</p>
              {!isLoading && (
                <p className="text-xs text-gray-500">
                  {(slotsData ?? []).length === 0
                    ? 'Sin turnos disponibles'
                    : `${(slotsData ?? []).length} turno${(slotsData ?? []).length !== 1 ? 's' : ''} disponible${(slotsData ?? []).length !== 1 ? 's' : ''}`}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
              <button
                onClick={() => setViewMode('card')}
                className={`p-1.5 rounded transition-colors ${viewMode === 'card' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                title="Vista card"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                title="Vista lista"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="card flex justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : (slotsData ?? []).length === 0 ? (
            <div className="card px-6 py-16 text-center text-gray-400">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-40" />
              <p className="text-sm font-medium">No hay turnos disponibles</p>
              <p className="text-xs mt-1">Probá con otra fecha o un rango horario diferente</p>
            </div>
          ) : viewMode === 'card' ? (
            /* Card view — agrupado por fecha → cancha */
            <div className="space-y-6">
              {Array.from(slotsByDateAndVenue.entries()).map(([dateKey, venueMap]) => (
                <div key={dateKey}>
                  {isRange && (
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 capitalize">
                      {formatDateLong(dateKey)}
                    </p>
                  )}
                  <div className="space-y-3">
                    {Array.from(venueMap.entries()).map(([, venueSlots]) => {
                      const venue = venueSlots[0]?.venue;
                      return (
                        <div key={venue?.id ?? 'unknown'} className="card overflow-hidden">
                          <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-semibold text-gray-800">{venue?.name}</span>
                          </div>
                          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                            {venueSlots.map((slot) => {
                              const pps = slot.playersPerSlot;
                              return (
                                <button
                                  key={slot.id}
                                  onClick={() => handleSelectSlot(slot)}
                                  className="flex flex-col items-center justify-center gap-0.5 border border-gray-200 rounded-xl py-3 px-2 hover:border-primary-400 hover:bg-primary-50 transition-colors group"
                                >
                                  <span className="text-sm font-semibold text-gray-900 group-hover:text-primary-700">
                                    {slot.startTime}
                                  </span>
                                  <span className="text-xs text-gray-400">{slot.endTime}</span>
                                  {pps != null && (
                                    <span className="flex items-center gap-0.5 text-[10px] text-gray-400 mt-0.5">
                                      <Users className="w-2.5 h-2.5" />
                                      {pps}
                                    </span>
                                  )}
                                  {slot.price != null && (
                                    <span className="mt-0.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                      ${slot.price.toLocaleString('es-AR')}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* List view */
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {isRange && (
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                    )}
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cancha
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Horario
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jugadores máx.
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Precio
                    </th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(slotsData ?? []).map((slot) => {
                    const maxP = slot.playersPerSlot ?? '—';
                    return (
                      <tr key={slot.id} className="hover:bg-gray-50">
                        {isRange && (
                          <td className="px-5 py-3 text-sm text-gray-500 whitespace-nowrap">
                            {formatDateShort(slot.date.slice(0, 10))}
                          </td>
                        )}
                        <td className="px-5 py-3 text-sm font-medium text-gray-900">
                          {slot.venue?.name ?? '—'}
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-600">
                          {slot.startTime} — {slot.endTime}
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-600">{maxP}</td>
                        <td className="px-5 py-3">
                          {slot.price != null ? (
                            <span className="text-sm font-bold text-emerald-600">
                              ${slot.price.toLocaleString('es-AR')}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => handleSelectSlot(slot)}
                            className="btn-primary py-1.5 px-4 text-sm"
                          >
                            Reservar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
      </div>

    </div>
  );
}
