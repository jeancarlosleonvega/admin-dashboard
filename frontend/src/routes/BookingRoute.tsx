import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@stores/authStore';

interface BookingRouteProps {
  children: React.ReactNode;
}

/**
 * Guard para rutas de reserva.
 * Solo los clientes (sin permiso users.manage) necesitan perfil completo.
 * Admins y staff pasan directo.
 */
export default function BookingRoute({ children }: BookingRouteProps) {
  const { user, can } = useAuthStore();
  const location = useLocation();

  // Clientes no tienen users.view — admins y recepcionistas sí
  const isStaffOrAdmin = can('users.view');

  if (!isStaffOrAdmin && user?.profileCompleted === false) {
    return <Navigate to="/complete-profile" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
