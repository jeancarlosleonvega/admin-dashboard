const LABELS: Record<string, string> = {
  // User / generic active
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
  SUSPENDED: 'Suspendido',
  // Membership
  PENDING: 'Pendiente de pago',
  CANCELLED: 'Cancelada',
  EXPIRED: 'Expirada',
  // Booking
  PENDING_PAYMENT: 'Pago pendiente',
  CONFIRMED: 'Confirmada',
  NO_SHOW: 'No se presentó',
  // Payment
  PENDING_PROOF: 'Esperando comprobante',
  PENDING_VALIDATION: 'Pendiente validación',
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
};

const COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  INACTIVE: 'bg-gray-100 text-gray-700',
  SUSPENDED: 'bg-red-100 text-red-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  CANCELLED: 'bg-red-100 text-red-700',
  EXPIRED: 'bg-orange-100 text-orange-700',
  PENDING_PAYMENT: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-green-100 text-green-700',
  NO_SHOW: 'bg-gray-100 text-gray-700',
  PENDING_PROOF: 'bg-yellow-100 text-yellow-700',
  PENDING_VALIDATION: 'bg-blue-100 text-blue-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
};

interface StatusBadgeProps {
  status?: string;
  /** Para campos booleanos: pasar active={true/false} en lugar de status */
  active?: boolean;
}

export default function StatusBadge({ status, active }: StatusBadgeProps) {
  const key = active !== undefined ? (active ? 'ACTIVE' : 'INACTIVE') : (status ?? '');
  const label = LABELS[key] ?? key;
  const color = COLORS[key] ?? 'bg-gray-100 text-gray-700';

  return (
    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${color}`}>
      {label}
    </span>
  );
}
