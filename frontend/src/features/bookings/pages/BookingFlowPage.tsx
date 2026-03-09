import { useState } from 'react';
import { usePageHeader } from '@/hooks/usePageHeader';
import { useQuery } from '@tanstack/react-query';
import { useSlots } from '@/hooks/queries/useSlots';
import { useAdditionalServices } from '@/hooks/queries/useAdditionalServices';
import { useCreateBooking } from '@/hooks/queries/useBookings';
import { apiClient } from '@api/client';
import { Spinner } from '@components/ui/Spinner';
import toast from 'react-hot-toast';
import type { PaymentMethod } from '@/types/booking.types';

type Step = 1 | 2 | 3 | 4;

export default function BookingFlowPage() {
  usePageHeader({ subtitle: 'Reservar un turno' });

  const [step, setStep] = useState<Step>(1);
  const [selectedSportTypeId, setSelectedSportTypeId] = useState('');
  const [selectedVenueId, setSelectedVenueId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('MERCADOPAGO');
  const [notes, setNotes] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState<Record<string, unknown> | null>(null);
  const [showTransferProofForm, setShowTransferProofForm] = useState(false);
  const [proofUrl, setProofUrl] = useState('');

  const { data: sportTypes } = useQuery({
    queryKey: ['sport-types'],
    queryFn: async () => {
      const res = await apiClient.get('/sport-types');
      return res.data.data as { id: string; name: string }[];
    },
  });

  const { data: venuesData } = useQuery({
    queryKey: ['venues', selectedSportTypeId],
    queryFn: async () => {
      const res = await apiClient.get(`/venues?sportTypeId=${selectedSportTypeId}&active=true`);
      return res.data.data as { id: string; name: string }[];
    },
    enabled: !!selectedSportTypeId,
  });

  const { data: slots, isLoading: slotsLoading } = useSlots(selectedVenueId, selectedDate);

  const { data: servicesData } = useAdditionalServices({
    sportTypeId: selectedSportTypeId || undefined,
    active: true,
  });

  const createBooking = useCreateBooking();

  const selectedSlot = slots?.find((s) => s.id === selectedSlotId);
  const services = servicesData?.data ?? [];

  const toggleService = (id: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleConfirm = async () => {
    try {
      const booking = await createBooking.mutateAsync({
        slotId: selectedSlotId,
        serviceIds: selectedServiceIds.length > 0 ? selectedServiceIds : undefined,
        paymentMethod,
        notes: notes || undefined,
      });
      setConfirmedBooking(booking);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      toast.error(message ?? 'Error al crear la reserva');
    }
  };

  const handleUploadProof = async () => {
    if (!confirmedBooking?.payment?.id || !proofUrl) return;
    try {
      await apiClient.post(`/payments/${confirmedBooking.payment.id}/transfer-proof`, { proofUrl });
      toast.success('Comprobante enviado. Tu reserva será confirmada en breve.');
      setShowTransferProofForm(false);
    } catch {
      toast.error('Error al enviar el comprobante');
    }
  };

  if (confirmedBooking) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="card p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {paymentMethod === 'MERCADOPAGO' ? '¡Reserva confirmada!' :
               paymentMethod === 'TRANSFER' ? 'Reserva creada' : 'Reserva pendiente'}
            </h2>
            <p className="text-gray-500 mt-1 text-sm">
              {new Date(confirmedBooking.slot.date).toLocaleDateString()} — {confirmedBooking.slot.startTime} a {confirmedBooking.slot.endTime}
            </p>
            <p className="text-gray-500 text-sm">{confirmedBooking.slot.venue?.name}</p>
          </div>

          {paymentMethod === 'MERCADOPAGO' && confirmedBooking.qrCode && (
            <div className="border-2 border-gray-300 rounded-lg p-6 text-center">
              <p className="text-xs text-gray-500 mb-2">Código QR</p>
              <p className="font-mono text-lg font-bold tracking-wider break-all">{confirmedBooking.qrCode}</p>
              <p className="text-xs text-gray-400 mt-2">Mostrá este código al ingresar al club</p>
            </div>
          )}

          {paymentMethod === 'TRANSFER' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
              <p className="text-sm font-medium text-yellow-800 mb-2">Instrucciones de pago por transferencia</p>
              <p className="text-sm text-yellow-700">Transferir a CBU XXXX a nombre del Club Pilar. Monto: <strong>${parseFloat(confirmedBooking.price.toString()).toLocaleString()}</strong></p>
              {!showTransferProofForm ? (
                <button onClick={() => setShowTransferProofForm(true)} className="mt-3 text-sm text-blue-600 hover:underline font-medium">
                  Cargar comprobante de pago
                </button>
              ) : (
                <div className="mt-3 space-y-2">
                  <input type="url" value={proofUrl} onChange={(e) => setProofUrl(e.target.value)} placeholder="URL del comprobante" className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm" />
                  <button onClick={handleUploadProof} disabled={!proofUrl} className="w-full px-3 py-1.5 bg-blue-600 text-white text-sm rounded disabled:opacity-50">Enviar comprobante</button>
                </div>
              )}
            </div>
          )}

          {paymentMethod === 'CASH' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700">Tu reserva está pendiente de pago en el club. Abona <strong>${parseFloat(confirmedBooking.price.toString()).toLocaleString()}</strong> el día de la reserva.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      {/* Step indicators */}
      <div className="flex items-center mb-6">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${s <= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
              {s}
            </div>
            {s < 4 && <div className={`h-0.5 w-12 ${s < step ? 'bg-blue-600' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Paso 1: Seleccionar espacio y fecha</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Deporte</label>
            <select value={selectedSportTypeId} onChange={(e) => { setSelectedSportTypeId(e.target.value); setSelectedVenueId(''); }} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">Seleccionar...</option>
              {(sportTypes ?? []).map((st) => (
                <option key={st.id} value={st.id}>{st.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Espacio</label>
            <select value={selectedVenueId} onChange={(e) => setSelectedVenueId(e.target.value)} disabled={!selectedSportTypeId} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-50">
              <option value="">Seleccionar...</option>
              {(venuesData ?? []).map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="flex justify-end">
            <button onClick={() => setStep(2)} disabled={!selectedVenueId || !selectedDate} className="btn-primary disabled:opacity-50">
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Paso 2: Seleccionar turno</h2>
          <p className="text-sm text-gray-500">{new Date(selectedDate).toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          {slotsLoading ? (
            <div className="flex justify-center py-8"><Spinner size="lg" /></div>
          ) : !slots || slots.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No hay turnos disponibles para esta fecha.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {slots.map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => setSelectedSlotId(slot.id)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                    selectedSlotId === slot.id
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {slot.startTime} - {slot.endTime}
                </button>
              ))}
            </div>
          )}
          <div className="flex justify-between">
            <button onClick={() => setStep(1)} className="btn-secondary">Atrás</button>
            <button onClick={() => setStep(3)} disabled={!selectedSlotId} className="btn-primary disabled:opacity-50">Siguiente</button>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Paso 3: Servicios adicionales</h2>
          {services.length === 0 ? (
            <p className="text-gray-500 text-sm">No hay servicios adicionales disponibles.</p>
          ) : (
            <div className="space-y-2">
              {services.map((service) => (
                <label key={service.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selectedServiceIds.includes(service.id)}
                    onChange={() => toggleService(service.id)}
                    className="rounded border-gray-300 text-blue-600"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{service.name}</p>
                    {service.description && <p className="text-xs text-gray-500">{service.description}</p>}
                  </div>
                  <span className="text-sm font-semibold text-gray-900">${parseFloat(service.price.toString()).toLocaleString()}</span>
                </label>
              ))}
            </div>
          )}
          <div className="flex justify-between">
            <button onClick={() => setStep(2)} className="btn-secondary">Atrás</button>
            <button onClick={() => setStep(4)} className="btn-primary">Siguiente</button>
          </div>
        </div>
      )}

      {/* Step 4 */}
      {step === 4 && selectedSlot && (
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Paso 4: Confirmar reserva</h2>

          <div className="bg-gray-50 rounded-lg p-4 space-y-1 text-sm">
            <p><span className="font-medium">Espacio:</span> {selectedSlot.venue?.name}</p>
            <p><span className="font-medium">Fecha:</span> {new Date(selectedDate).toLocaleDateString()}</p>
            <p><span className="font-medium">Horario:</span> {selectedSlot.startTime} - {selectedSlot.endTime}</p>
            {selectedServiceIds.length > 0 && (
              <p><span className="font-medium">Servicios:</span> {services.filter((s) => selectedServiceIds.includes(s.id)).map((s) => s.name).join(', ')}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Método de pago</label>
            <div className="space-y-2">
              {(['MERCADOPAGO', 'TRANSFER', 'CASH'] as PaymentMethod[]).map((method) => (
                <label key={method} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input type="radio" name="paymentMethod" value={method} checked={paymentMethod === method} onChange={() => setPaymentMethod(method)} className="text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {method === 'MERCADOPAGO' ? 'MercadoPago (inmediato)' : method === 'TRANSFER' ? 'Transferencia bancaria' : 'Efectivo en el club'}
                  </span>
                </label>
              ))}
            </div>
            {paymentMethod === 'TRANSFER' && (
              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                Transferir a CBU XXXX a nombre del Club. Tendrás 24hs para cargar el comprobante.
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(3)} className="btn-secondary">Atrás</button>
            <button onClick={handleConfirm} disabled={createBooking.isPending} className="btn-primary disabled:opacity-50 flex items-center gap-2">
              {createBooking.isPending && <Spinner size="sm" />}
              Confirmar Reserva
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
