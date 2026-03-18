import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePageHeader } from '@/hooks/usePageHeader';
import { useAdditionalServices } from '@/hooks/queries/useAdditionalServices';
import { useCreateBooking } from '@/hooks/queries/useBookings';
import { Spinner } from '@components/ui/Spinner';
import { ArrowLeft, CheckCircle, Calendar, Clock, MapPin, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import type { SlotAvailability } from '@/types/venue-schedule.types';
import type { Booking, PaymentMethod } from '@/types/booking.types';
import { formatDateLong } from '@lib/formatDate';

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  MERCADOPAGO: 'MercadoPago (inmediato)',
  TRANSFER: 'Transferencia bancaria',
  CASH: 'Efectivo en el club',
  WALLET: 'Wallet',
};

interface LocationState {
  slot: SlotAvailability;
  numPlayers: number;
}

export default function BookingCreatePage() {
  usePageHeader({ subtitle: 'Confirmar reserva' });

  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;

  const { data: servicesData } = useAdditionalServices({ active: true, limit: 100 });
  const services = servicesData?.data ?? [];

  const createBooking = useCreateBooking();

  const slot: SlotAvailability | null = state?.slot ?? null;
  const initialPlayers = state?.numPlayers ?? 1;

  const maxPlayers = slot ? (slot.playersPerSlot ?? 10) : 10;

  const [players, setPlayers] = useState(Math.min(initialPlayers, maxPlayers));
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('MERCADOPAGO');
  const [notes, setNotes] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  // Redirigir si no hay datos del slot
  if (!slot) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-gray-500 mb-4">No se encontraron datos del turno seleccionado.</p>
        <button onClick={() => navigate('/reservas/nueva')} className="btn-primary">
          Volver a buscar
        </button>
      </div>
    );
  }

  const dateLabel = formatDateLong(slot.date.slice(0, 10));

  const toggleService = (id: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const selectedServices = services.filter((s) => selectedServiceIds.includes(s.id));
  const servicesTotal = selectedServices.reduce(
    (sum, s) => sum + parseFloat(s.price.toString()),
    0,
  );
  const total = (slot.price ?? 0) + servicesTotal;

  const handleConfirm = async () => {
    try {
      const booking = await createBooking.mutateAsync({
        slotId: slot.id,
        numPlayers: players,
        serviceIds: selectedServiceIds.length > 0 ? selectedServiceIds : undefined,
        paymentMethod,
        notes: notes || undefined,
      });
      setConfirmedBooking(booking);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message;
      toast.error(message ?? 'Error al crear la reserva');
    }
  };

  // ─── Pantalla de confirmación ─────────────────────────────────────────────
  if (confirmedBooking) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="card p-8 text-center space-y-5">
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
                Monto: <strong>${confirmedBooking.price.toLocaleString()}</strong>. Tenés 24hs para
                cargar el comprobante.
              </p>
            </div>
          )}
          {paymentMethod === 'CASH' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
              Abonás <strong>${confirmedBooking.price.toLocaleString()}</strong> el día de la
              reserva.
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => navigate('/mis-reservas')}
              className="btn-secondary flex-1"
            >
              Ver mis reservas
            </button>
            <button
              onClick={() => navigate('/reservas/nueva')}
              className="btn-primary flex-1"
            >
              Nueva reserva
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Formulario ───────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Botón volver */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a los turnos
      </button>

      {/* Resumen del turno */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Turno seleccionado
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-gray-400">Cancha</p>
              <p className="text-sm font-medium text-gray-900">{slot.venue?.name ?? '—'}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Calendar className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-gray-400">Fecha</p>
              <p className="text-sm font-medium text-gray-900 capitalize">{dateLabel}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-gray-400">Horario</p>
              <p className="text-sm font-medium text-gray-900">
                {slot.startTime} — {slot.endTime}
              </p>
            </div>
          </div>
          {slot.price != null && (
            <div className="flex items-start gap-2">
              <div className="w-4 h-4 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Precio base</p>
                <p className="text-lg font-bold text-emerald-600">
                  ${slot.price.toLocaleString('es-AR')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Formulario */}
      <div className="card p-5 space-y-6">
        {/* Jugadores */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cantidad de jugadores{' '}
            <span className="text-xs text-gray-400 font-normal">(máx. {maxPlayers})</span>
          </label>
          <div className="flex items-center gap-3">
            <select
              value={players}
              onChange={(e) => setPlayers(Number(e.target.value))}
              className="input w-48"
            >
              {Array.from({ length: maxPlayers }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? 'jugador' : 'jugadores'}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <Users className="w-4 h-4" />
              <span>{players} seleccionado{players !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        {/* Servicios adicionales */}
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

      {/* Total y acción */}
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Total a abonar</p>
            <p className="text-2xl font-bold text-gray-900">
              ${total.toLocaleString('es-AR')}
            </p>
            {selectedServices.length > 0 && (
              <p className="text-xs text-gray-400 mt-0.5">
                Turno ${(slot.price ?? 0).toLocaleString('es-AR')} + servicios $
                {servicesTotal.toLocaleString('es-AR')}
              </p>
            )}
          </div>
          <button
            onClick={handleConfirm}
            disabled={createBooking.isPending}
            className="btn-primary flex items-center gap-2 px-8 py-3 text-base"
          >
            {createBooking.isPending && <Spinner size="sm" className="text-white" />}
            Confirmar reserva
          </button>
        </div>
      </div>
    </div>
  );
}
