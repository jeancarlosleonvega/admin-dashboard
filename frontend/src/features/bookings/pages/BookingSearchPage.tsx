import { useState, useMemo } from 'react';
import { usePageHeader } from '@/hooks/usePageHeader';
import { useSearchSlots } from '@/hooks/queries/useSlots';
import { useVenues } from '@/hooks/queries/useVenues';
import { useAdditionalServices } from '@/hooks/queries/useAdditionalServices';
import { useCreateBooking } from '@/hooks/queries/useBookings';
import { Spinner } from '@components/ui/Spinner';
import {
  Search,
  LayoutGrid,
  List,
  Clock,
  Users,
  MapPin,
  CheckCircle,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { SlotAvailability } from '@/types/venue-schedule.types';
import type { PaymentMethod } from '@/types/booking.types';

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  MERCADOPAGO: 'MercadoPago (inmediato)',
  TRANSFER: 'Transferencia bancaria',
  CASH: 'Efectivo en el club',
};

function toISODate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ─── Booking modal ────────────────────────────────────────────────────────────

interface BookingModalProps {
  slot: SlotAvailability;
  numPlayers: number;
  onClose: () => void;
}

function BookingModal({ slot, numPlayers: initialPlayers, onClose }: BookingModalProps) {
  const { data: servicesData } = useAdditionalServices({ active: true, limit: 100 });
  const services = servicesData?.data ?? [];

  const maxPlayers = slot.venue?.playersPerSlot ?? slot.venue?.sportType?.defaultPlayersPerSlot ?? 10;

  const [players, setPlayers] = useState(Math.min(initialPlayers, maxPlayers));
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('MERCADOPAGO');
  const [notes, setNotes] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Record<string, unknown> | null>(null);

  const createBooking = useCreateBooking();

  const toggleService = (id: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const handleConfirm = async () => {
    try {
      const booking = await createBooking.mutateAsync({
        slotId: slot.id,
        numPlayers: players,
        serviceIds: selectedServiceIds.length > 0 ? selectedServiceIds : undefined,
        paymentMethod,
        notes: notes || undefined,
      });
      setConfirmedBooking(booking as Record<string, unknown>);
      setConfirmed(true);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message;
      toast.error(message ?? 'Error al crear la reserva');
    }
  };

  const dateLabel = new Date(slot.date.slice(0, 10) + 'T12:00:00').toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  if (confirmed && confirmedBooking) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center space-y-5">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {paymentMethod === 'MERCADOPAGO' ? '¡Reserva confirmada!' : 'Reserva creada'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {slot.venue?.name} · {dateLabel}
            </p>
            <p className="text-sm text-gray-500">
              {slot.startTime} — {slot.endTime}
            </p>
          </div>
          {paymentMethod === 'TRANSFER' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
              <p className="text-sm font-medium text-yellow-800 mb-1">Pago por transferencia</p>
              <p className="text-sm text-yellow-700">
                Monto:{' '}
                <strong>
                  ${parseFloat((confirmedBooking.price as string) ?? '0').toLocaleString()}
                </strong>
                . Tenés 24hs para cargar el comprobante.
              </p>
            </div>
          )}
          {paymentMethod === 'CASH' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
              Abonás{' '}
              <strong>
                ${parseFloat((confirmedBooking.price as string) ?? '0').toLocaleString()}
              </strong>{' '}
              el día de la reserva.
            </div>
          )}
          <button onClick={onClose} className="btn-primary w-full">
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Confirmar reserva</h2>
            <p className="text-sm text-gray-500">
              {slot.venue?.name} · {dateLabel} · {slot.startTime} — {slot.endTime}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">
          {/* Jugadores */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cantidad de jugadores{' '}
              <span className="text-xs text-gray-400 font-normal">(máx. {maxPlayers})</span>
            </label>
            <select
              value={players}
              onChange={(e) => setPlayers(Number(e.target.value))}
              className="input"
            >
              {Array.from({ length: maxPlayers }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? 'jugador' : 'jugadores'}
                </option>
              ))}
            </select>
          </div>

          {/* Servicios */}
          {services.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Servicios adicionales{' '}
                <span className="text-xs text-gray-400 font-normal">(opcional)</span>
              </label>
              <div className="space-y-2">
                {services.map((service) => (
                  <label
                    key={service.id}
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedServiceIds.includes(service.id)}
                      onChange={() => toggleService(service.id)}
                      className="rounded border-gray-300 text-primary-600"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{service.name}</p>
                      {service.description && (
                        <p className="text-xs text-gray-500 truncate">{service.description}</p>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-gray-900 shrink-0">
                      ${parseFloat(service.price.toString()).toLocaleString()}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Método de pago */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Método de pago</label>
            <div className="space-y-2">
              {(['MERCADOPAGO', 'TRANSFER', 'CASH'] as PaymentMethod[]).map((method) => (
                <label
                  key={method}
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method}
                    checked={paymentMethod === method}
                    onChange={() => setPaymentMethod(method)}
                    className="text-primary-600"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {PAYMENT_LABELS[method]}
                  </span>
                </label>
              ))}
            </div>
            {paymentMethod === 'TRANSFER' && (
              <p className="mt-2 text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                Transferir a CBU XXXX a nombre del Club. Tenés 24hs para cargar el comprobante.
              </p>
            )}
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas <span className="text-xs text-gray-400 font-normal">(opcional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Alguna indicación especial..."
              className="input"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={createBooking.isPending}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {createBooking.isPending && <Spinner size="sm" className="text-white" />}
            Confirmar reserva
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function BookingSearchPage() {
  usePageHeader({ subtitle: 'Nueva reserva' });

  const today = toISODate(new Date());

  // Toolbar state
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [venueId, setVenueId] = useState('');
  const [numPlayers, setNumPlayers] = useState(1);
  const [searched, setSearched] = useState(true);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  // Booking modal
  const [selectedSlot, setSelectedSlot] = useState<SlotAvailability | null>(null);

  const { data: venuesData } = useVenues({ active: 'true', limit: 100 });
  const venues = venuesData?.data ?? [];

  const searchParams = useMemo(
    () => ({
      startDate,
      endDate: endDate || startDate,
      venueId: venueId || undefined,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
    }),
    [startDate, endDate, venueId, startTime, endTime],
  );

  const { data: slotsData, isLoading, isFetching } = useSearchSlots(searchParams, searched);

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

  const isRange = startDate !== endDate && !!endDate;
  const rangeLabel = isRange
    ? `${new Date(startDate + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })} — ${new Date(endDate + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}`
    : startDate
    ? new Date(startDate + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  const handleSearch = () => {
    if (!startDate) return;
    setSearched(true);
  };

  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    if (endDate && val > endDate) setEndDate(val);
    setSearched(false);
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
              onChange={(e) => { setEndDate(e.target.value); setSearched(false); }}
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
              onChange={(e) => { setStartTime(e.target.value); setSearched(false); }}
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
              onChange={(e) => { setEndTime(e.target.value); setSearched(false); }}
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
              onChange={(e) => { setVenueId(e.target.value); setSearched(false); }}
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

          {/* Buscar */}
          <div>
            <button
              onClick={handleSearch}
              disabled={!startDate || isFetching}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isFetching ? <Spinner size="sm" className="text-white" /> : <Search className="w-4 h-4" />}
              Buscar
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {searched && (
        <div>
          {/* Results header */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-gray-800 capitalize">{rangeLabel}</p>
              {!isLoading && (
                <p className="text-xs text-gray-500">
                  {(slotsData?.length ?? 0) === 0
                    ? 'Sin turnos disponibles'
                    : `${(slotsData?.length ?? 0)} turno${(slotsData?.length ?? 0) !== 1 ? 's' : ''} disponible${(slotsData?.length ?? 0) !== 1 ? 's' : ''}`}
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
          ) : (slotsData?.length ?? 0) === 0 ? (
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
                      {new Date(dateKey + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                  )}
                  <div className="space-y-3">
                    {Array.from(venueMap.entries()).map(([, venueSlots]) => {
                      const venue = venueSlots[0]?.venue;
                      const maxP = venue?.playersPerSlot ?? venue?.sportType?.defaultPlayersPerSlot ?? 10;
                      return (
                        <div key={venue?.id ?? 'unknown'} className="card overflow-hidden">
                          <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-semibold text-gray-800">{venue?.name}</span>
                            <span className="ml-auto flex items-center gap-1 text-xs text-gray-400">
                              <Users className="w-3.5 h-3.5" />
                              hasta {maxP} jugadores
                            </span>
                          </div>
                          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                            {venueSlots.map((slot) => (
                              <button
                                key={slot.id}
                                onClick={() => setSelectedSlot(slot)}
                                className="flex flex-col items-center justify-center gap-0.5 border border-gray-200 rounded-xl py-3 px-2 hover:border-primary-400 hover:bg-primary-50 transition-colors group"
                              >
                                <span className="text-sm font-semibold text-gray-900 group-hover:text-primary-700">
                                  {slot.startTime}
                                </span>
                                <span className="text-xs text-gray-400">{slot.endTime}</span>
                                <span className="mt-1 text-[10px] font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                  Disponible
                                </span>
                              </button>
                            ))}
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
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(slotsData ?? []).map((slot) => {
                    const maxP =
                      slot.venue?.playersPerSlot ??
                      slot.venue?.sportType?.defaultPlayersPerSlot ??
                      '—';
                    return (
                      <tr key={slot.id} className="hover:bg-gray-50">
                        {isRange && (
                          <td className="px-5 py-3 text-sm text-gray-500 whitespace-nowrap">
                            {new Date(slot.date.slice(0, 10) + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </td>
                        )}
                        <td className="px-5 py-3 text-sm font-medium text-gray-900">
                          {slot.venue?.name ?? '—'}
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-600">
                          {slot.startTime} — {slot.endTime}
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-600">{maxP}</td>
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => setSelectedSlot(slot)}
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
      )}

      {/* Booking modal */}
      {selectedSlot && (
        <BookingModal
          slot={selectedSlot}
          numPlayers={numPlayers}
          onClose={() => setSelectedSlot(null)}
        />
      )}
    </div>
  );
}
