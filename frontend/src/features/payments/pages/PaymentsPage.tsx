import { useState, useCallback } from 'react';
import { usePageHeader } from '@/hooks/usePageHeader';
import { DollarSign, Eye } from 'lucide-react';
import { usePayments, useValidateTransfer } from '@/hooks/queries/usePayments';
import { Spinner } from '@components/ui/Spinner';
import DataToolbar from '@components/shared/DataToolbar';
import { useColumnVisibility } from '@/hooks/useColumnVisibility';
import type { ColumnDef } from '@/hooks/useColumnVisibility';
import type { PaymentWithBooking } from '@api/payments.api';
import { formatDate, formatDateTime } from '@lib/formatDate';
import toast from 'react-hot-toast';

const METHOD_LABEL: Record<string, string> = {
  TRANSFER: 'Transferencia',
  MERCADOPAGO: 'MercadoPago',
  CASH: 'Efectivo',
};

const STATUS_LABEL: Record<string, string> = {
  PENDING_PROOF: 'Esperando comprobante',
  PENDING_VALIDATION: 'Pendiente validación',
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
  CANCELLED: 'Cancelado',
};

const STATUS_BADGE: Record<string, string> = {
  PENDING_PROOF: 'bg-yellow-100 text-yellow-700',
  PENDING_VALIDATION: 'bg-blue-100 text-blue-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-600',
};

const TABS = [
  { id: '', label: 'Todos' },
  { id: 'TRANSFER', label: 'Transferencia' },
  { id: 'MERCADOPAGO', label: 'MercadoPago' },
  { id: 'CASH', label: 'Efectivo' },
];

const columns: ColumnDef[] = [
  { key: 'user', label: 'Socio', sortable: false, filterable: false },
  { key: 'venue', label: 'Espacio', sortable: false, filterable: false },
  { key: 'date', label: 'Fecha reserva', sortable: false, filterable: false },
  { key: 'method', label: 'Método', sortable: false, filterable: false },
  { key: 'amount', label: 'Monto', sortable: false, filterable: false },
  { key: 'status', label: 'Estado', sortable: false, filterable: false },
  { key: 'createdAt', label: 'Registrado', sortable: false, filterable: false },
  { key: 'actions', label: 'Acciones', sortable: false, filterable: false },
];

export default function PaymentsPage() {
  usePageHeader({});

  const [activeTab, setActiveTab] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<PaymentWithBooking | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectMode, setRejectMode] = useState(false);

  const { visibleColumns, toggleColumn, resetColumns } = useColumnVisibility('payments-columns', columns);

  const { data: payments = [], isLoading, isError } = usePayments(activeTab || undefined);
  const validateTransfer = useValidateTransfer();

  const handleApprove = async (id: string) => {
    try {
      await validateTransfer.mutateAsync({ id, data: { approved: true } });
      toast.success('Transferencia aprobada. Reserva confirmada.');
      setSelectedPayment(null);
    } catch {
      toast.error('Error al aprobar la transferencia');
    }
  };

  const handleReject = async () => {
    if (!selectedPayment) return;
    try {
      await validateTransfer.mutateAsync({ id: selectedPayment.id, data: { approved: false, reason: rejectReason } });
      toast.success('Transferencia rechazada');
      setSelectedPayment(null);
      setRejectReason('');
      setRejectMode(false);
    } catch {
      toast.error('Error al rechazar la transferencia');
    }
  };

  const closeDetail = () => {
    setSelectedPayment(null);
    setRejectReason('');
    setRejectMode(false);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Pagos</h1>
        <p className="text-sm text-gray-500 mt-1">
          Historial de pagos y gestión de transferencias pendientes.
        </p>
      </div>

      {/* Tabs de método */}
      <div className="border-b border-gray-200 mb-4">
        <nav className="-mb-px flex space-x-8">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`border-b-2 py-3 px-1 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <DataToolbar
        columns={columns}
        onSearchChange={useCallback(() => {}, [])}
        onSortChange={useCallback(() => {}, [])}
        onFiltersChange={useCallback(() => {}, [])}
        visibleColumns={visibleColumns}
        onToggleColumn={toggleColumn}
        onResetColumns={resetColumns}
      />

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : isError ? (
          <div className="px-6 py-12 text-center text-red-500">
            <p>No se pudieron cargar los pagos. Por favor, intentá de nuevo.</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No hay pagos registrados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {visibleColumns.includes('user') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Socio</th>
                  )}
                  {visibleColumns.includes('venue') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Espacio</th>
                  )}
                  {visibleColumns.includes('date') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha reserva</th>
                  )}
                  {visibleColumns.includes('method') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método</th>
                  )}
                  {visibleColumns.includes('amount') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                  )}
                  {visibleColumns.includes('status') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  )}
                  {visibleColumns.includes('createdAt') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registrado</th>
                  )}
                  {visibleColumns.includes('actions') && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    {visibleColumns.includes('user') && (
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {p.booking.user.firstName} {p.booking.user.lastName}
                        <p className="text-xs text-gray-500 mt-0.5">{p.booking.user.email}</p>
                      </td>
                    )}
                    {visibleColumns.includes('venue') && (
                      <td className="px-6 py-4 text-sm text-gray-500">{p.booking.slot.venue.name}</td>
                    )}
                    {visibleColumns.includes('date') && (
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(p.booking.slot.date)}
                        <p className="text-xs text-gray-400 mt-0.5">{p.booking.slot.startTime}–{p.booking.slot.endTime}</p>
                      </td>
                    )}
                    {visibleColumns.includes('method') && (
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {METHOD_LABEL[p.method] ?? p.method}
                      </td>
                    )}
                    {visibleColumns.includes('amount') && (
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        ${Number(p.amount).toLocaleString('es-AR')}
                      </td>
                    )}
                    {visibleColumns.includes('status') && (
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${STATUS_BADGE[p.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {STATUS_LABEL[p.status] ?? p.status}
                        </span>
                      </td>
                    )}
                    {visibleColumns.includes('createdAt') && (
                      <td className="px-6 py-4 text-sm text-gray-500">{formatDateTime(p.createdAt)}</td>
                    )}
                    {visibleColumns.includes('actions') && (
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedPayment(p)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50"
                          title="Ver detalle"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal detalle */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Detalle del pago</h2>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Socio</span>
                <span className="font-medium text-gray-900">
                  {selectedPayment.booking.user.firstName} {selectedPayment.booking.user.lastName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Email</span>
                <span className="text-gray-700">{selectedPayment.booking.user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Espacio</span>
                <span className="text-gray-700">{selectedPayment.booking.slot.venue.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Fecha reserva</span>
                <span className="text-gray-700">
                  {formatDate(selectedPayment.booking.slot.date)} {selectedPayment.booking.slot.startTime}–{selectedPayment.booking.slot.endTime}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Método</span>
                <span className="text-gray-700">{METHOD_LABEL[selectedPayment.method] ?? selectedPayment.method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Monto</span>
                <span className="font-semibold text-gray-900">${Number(selectedPayment.amount).toLocaleString('es-AR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Estado</span>
                <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${STATUS_BADGE[selectedPayment.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {STATUS_LABEL[selectedPayment.status] ?? selectedPayment.status}
                </span>
              </div>
              {selectedPayment.transferProofUrl && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Comprobante</span>
                  <a href={selectedPayment.transferProofUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    Ver comprobante
                  </a>
                </div>
              )}
              {selectedPayment.rejectionReason && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Motivo rechazo</span>
                  <span className="text-red-600">{selectedPayment.rejectionReason}</span>
                </div>
              )}
              {selectedPayment.approvedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Aprobado el</span>
                  <span className="text-gray-700">{formatDateTime(selectedPayment.approvedAt)}</span>
                </div>
              )}
            </div>

            {/* Acciones de validación de transferencia */}
            {selectedPayment.status === 'PENDING_VALIDATION' && selectedPayment.method === 'TRANSFER' && !rejectMode && (
              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button
                  onClick={() => handleApprove(selectedPayment.id)}
                  disabled={validateTransfer.isPending}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {validateTransfer.isPending && <Spinner size="sm" />}
                  Aprobar
                </button>
                <button
                  onClick={() => setRejectMode(true)}
                  disabled={validateTransfer.isPending}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  Rechazar
                </button>
              </div>
            )}

            {rejectMode && (
              <div className="pt-2 border-t border-gray-100 space-y-3">
                <div>
                  <label className="label">Motivo del rechazo</label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="input resize-none"
                    rows={3}
                    placeholder="Ingresá el motivo..."
                  />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setRejectMode(false)} className="btn-secondary flex-1">Cancelar</button>
                  <button
                    onClick={handleReject}
                    disabled={validateTransfer.isPending}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {validateTransfer.isPending && <Spinner size="sm" />}
                    Confirmar rechazo
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-gray-100">
              <button onClick={closeDetail} className="btn-secondary">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
