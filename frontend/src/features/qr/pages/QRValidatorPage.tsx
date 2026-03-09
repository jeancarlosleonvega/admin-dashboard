import { useState } from 'react';
import { usePageHeader } from '@/hooks/usePageHeader';
import { QrCode } from 'lucide-react';
import { qrApi, type QRValidationResult } from '@api/qr.api';
import { Spinner } from '@components/ui/Spinner';

export default function QRValidatorPage() {
  usePageHeader({ subtitle: 'Validar código de acceso QR' });

  const [code, setCode] = useState('');
  const [result, setResult] = useState<QRValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleValidate = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const data = await qrApi.validateQR(code.trim());
      setResult(data);
    } catch (err: unknown) {
      setError(err?.response?.data?.error?.message ?? 'QR inválido o error al validar');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleValidate();
  };

  const reset = () => {
    setCode('');
    setResult(null);
    setError(null);
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <QrCode className="w-6 h-6 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Validar QR</h2>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Código QR</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ingresa o escanea el código..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            autoFocus
          />
        </div>

        <button
          onClick={handleValidate}
          disabled={!code.trim() || loading}
          className="w-full btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <Spinner size="sm" />}
          Validar
        </button>

        {result && (
          <div className="border-2 border-green-300 bg-green-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="font-semibold text-green-800">Acceso válido</span>
            </div>
            <div className="text-sm space-y-1">
              <p className="font-medium text-gray-900">{result.booking.user.firstName} {result.booking.user.lastName}</p>
              <p className="text-gray-600">{result.booking.slot.venue.name}</p>
              <p className="text-gray-600">
                {new Date(result.booking.slot.date).toLocaleDateString()} — {result.booking.slot.startTime} a {result.booking.slot.endTime}
              </p>
              {result.booking.services.length > 0 && (
                <div>
                  <p className="font-medium text-gray-700 mt-2">Servicios:</p>
                  {result.booking.services.map((s) => (
                    <p key={s.id} className="text-gray-600">• {s.name}</p>
                  ))}
                </div>
              )}
            </div>
            <button onClick={reset} className="w-full text-sm text-green-700 hover:text-green-900 font-medium">
              Validar otro código
            </button>
          </div>
        )}

        {error && (
          <div className="border-2 border-red-300 bg-red-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <span className="font-semibold text-red-800">Acceso inválido</span>
            </div>
            <p className="text-sm text-red-700">{error}</p>
            <button onClick={reset} className="w-full text-sm text-red-700 hover:text-red-900 font-medium">
              Intentar de nuevo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
