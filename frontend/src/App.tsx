import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@stores/authStore';
import { useEffect } from 'react';

// Layouts
import MainLayout from '@components/layout/MainLayout';
import AuthLayout from '@components/layout/AuthLayout';

// Auth pages
import LoginPage from '@features/auth/pages/LoginPage';
import RegisterPage from '@features/auth/pages/RegisterPage';
import ForgotPasswordPage from '@features/auth/pages/ForgotPasswordPage';
import ResetPasswordPage from '@features/auth/pages/ResetPasswordPage';

// Protected pages
import DashboardPage from '@features/dashboard/pages/DashboardPage';
import UserCreatePage from '@features/users/pages/UserCreatePage';
import UserDetailPage from '@features/users/pages/UserDetailPage';
import UserEditPage from '@features/users/pages/UserEditPage';
import RoleCreatePage from '@features/roles/pages/RoleCreatePage';
import RoleDetailPage from '@features/roles/pages/RoleDetailPage';
import RoleEditPage from '@features/roles/pages/RoleEditPage';
import PermissionCreatePage from '@features/permissions/pages/PermissionCreatePage';
import PermissionDetailPage from '@features/permissions/pages/PermissionDetailPage';
import PermissionEditPage from '@features/permissions/pages/PermissionEditPage';
import SportTypeCreatePage from '@features/sport-types/pages/SportTypeCreatePage';
import SportTypeEditPage from '@features/sport-types/pages/SportTypeEditPage';
import SportTypeDetailPage from '@features/sport-types/pages/SportTypeDetailPage';
import VenueCreatePage from '@features/venues/pages/VenueCreatePage';
import VenueEditPage from '@features/venues/pages/VenueEditPage';
import VenueDetailPage from '@features/venues/pages/VenueDetailPage';
import MembershipPlanCreatePage from '@features/membership-plans/pages/MembershipPlanCreatePage';
import MembershipPlanEditPage from '@features/membership-plans/pages/MembershipPlanEditPage';
import VenueScheduleCreatePage from '@features/venue-schedules/pages/VenueScheduleCreatePage';
import VenueScheduleEditPage from '@features/venue-schedules/pages/VenueScheduleEditPage';
import SlotsViewPage from '@features/slots/pages/SlotsViewPage';
import BlockedPeriodCreatePage from '@features/blocked-periods/pages/BlockedPeriodCreatePage';
import BlockedPeriodEditPage from '@features/blocked-periods/pages/BlockedPeriodEditPage';
import AdditionalServiceCreatePage from '@features/additional-services/pages/AdditionalServiceCreatePage';
import AdditionalServiceEditPage from '@features/additional-services/pages/AdditionalServiceEditPage';
import BookingSearchPage from '@features/bookings/pages/BookingSearchPage';
import MyBookingsPage from '@features/bookings/pages/MyBookingsPage';
import UserMembershipCreatePage from '@features/user-memberships/pages/UserMembershipCreatePage';
import ConditionTypeCreatePage from '@features/condition-types/pages/ConditionTypeCreatePage';
import ConditionTypeEditPage from '@features/condition-types/pages/ConditionTypeEditPage';
import CompleteProfilePage from '@features/profile/pages/CompleteProfilePage';
import MyProfilePage from '@features/profile/pages/MyProfilePage';
import MyMembershipPage from '@features/my-membership/pages/MyMembershipPage';
import MyWalletPage from '@features/wallet/pages/MyWalletPage';
import MisPagosPage from '@features/payments/pages/MisPagosPage';
import FinanzasPage from '@features/finanzas/pages/FinanzasPage';
import ConfiguracionPage from '@features/configuracion/pages/ConfiguracionPage';
import InstalacionesPage from '@features/instalaciones/pages/InstalacionesPage';
import SociosPage from '@features/socios/pages/SociosPage';
import ReservasHubPage from '@features/bookings/pages/ReservasHubPage';

// Route guards
import ProtectedRoute from '@/routes/ProtectedRoute';
import PermissionRoute from '@/routes/PermissionRoute';
import BookingRoute from '@/routes/BookingRoute';

// Components
import { Spinner } from '@components/ui/Spinner';

function App() {
  const { isAuthenticated, isLoading, initialize } = useAuthStore();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/inicio';

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route element={<AuthLayout />}>
        <Route
          path="/iniciar-sesion"
          element={
            isAuthenticated ? <Navigate to={from} replace /> : <LoginPage />
          }
        />
        <Route
          path="/registrarse"
          element={
            isAuthenticated ? <Navigate to={from} replace /> : <RegisterPage />
          }
        />
        <Route path="/olvide-contrasena" element={<ForgotPasswordPage />} />
        <Route path="/restablecer-contrasena" element={<ResetPasswordPage />} />
      </Route>

      {/* Protected routes */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route
          path="/inicio"
          element={
            <PermissionRoute permission="dashboard.view">
              <DashboardPage />
            </PermissionRoute>
          }
        />
        {/* Users CRUD */}
        <Route
          path="/usuarios"
          element={<Navigate to="/configuracion?tab=seguridad" replace />}
        />
        <Route
          path="/usuarios/create"
          element={
            <PermissionRoute permission="users.create">
              <UserCreatePage />
            </PermissionRoute>
          }
        />
        <Route
          path="/usuarios/:id"
          element={
            <PermissionRoute permission="users.view">
              <UserDetailPage />
            </PermissionRoute>
          }
        />
        <Route
          path="/usuarios/:id/edit"
          element={
            <PermissionRoute permission="users.edit">
              <UserEditPage />
            </PermissionRoute>
          }
        />

        {/* Roles CRUD */}
        <Route
          path="/roles"
          element={<Navigate to="/configuracion?tab=seguridad" replace />}
        />
        <Route
          path="/roles/create"
          element={
            <PermissionRoute permission="roles.manage">
              <RoleCreatePage />
            </PermissionRoute>
          }
        />
        <Route
          path="/roles/:id"
          element={
            <PermissionRoute permission="roles.view">
              <RoleDetailPage />
            </PermissionRoute>
          }
        />
        <Route
          path="/roles/:id/edit"
          element={
            <PermissionRoute permission="roles.manage">
              <RoleEditPage />
            </PermissionRoute>
          }
        />

        {/* Permissions CRUD */}
        <Route
          path="/permissions"
          element={<Navigate to="/configuracion?tab=seguridad" replace />}
        />
        <Route
          path="/permissions/create"
          element={
            <PermissionRoute permission="roles.manage">
              <PermissionCreatePage />
            </PermissionRoute>
          }
        />
        <Route
          path="/permissions/:id"
          element={
            <PermissionRoute permission="roles.view">
              <PermissionDetailPage />
            </PermissionRoute>
          }
        />
        <Route
          path="/permissions/:id/edit"
          element={
            <PermissionRoute permission="roles.manage">
              <PermissionEditPage />
            </PermissionRoute>
          }
        />

        {/* Hub: Instalaciones */}
        <Route
          path="/instalaciones"
          element={
            <PermissionRoute permission="sport-types.view">
              <InstalacionesPage />
            </PermissionRoute>
          }
        />
        {/* Redirects para rutas individuales de listado */}
        <Route path="/tipos-deporte" element={<Navigate to="/instalaciones?tab=tipos-deporte" replace />} />
        <Route path="/espacios" element={<Navigate to="/instalaciones?tab=espacios" replace />} />
        <Route path="/horarios" element={<Navigate to="/instalaciones?tab=horarios" replace />} />
        <Route path="/periodos-bloqueados" element={<Navigate to="/instalaciones?tab=periodos-bloqueados" replace />} />
        <Route path="/tipos-condicion" element={<Navigate to="/instalaciones?tab=tipos-condicion" replace />} />

        {/* Sport Types CRUD (create/edit/detail se mantienen) */}
        <Route
          path="/tipos-deporte/create"
          element={
            <PermissionRoute permission="sport-types.manage">
              <SportTypeCreatePage />
            </PermissionRoute>
          }
        />
        <Route
          path="/tipos-deporte/:id"
          element={
            <PermissionRoute permission="sport-types.view">
              <SportTypeDetailPage />
            </PermissionRoute>
          }
        />
        <Route
          path="/tipos-deporte/:id/edit"
          element={
            <PermissionRoute permission="sport-types.manage">
              <SportTypeEditPage />
            </PermissionRoute>
          }
        />

        {/* Venues CRUD */}
        <Route
          path="/espacios/create"
          element={
            <PermissionRoute permission="venues.manage">
              <VenueCreatePage />
            </PermissionRoute>
          }
        />
        <Route
          path="/espacios/:id"
          element={
            <PermissionRoute permission="venues.view">
              <VenueDetailPage />
            </PermissionRoute>
          }
        />
        <Route
          path="/espacios/:id/edit"
          element={
            <PermissionRoute permission="venues.manage">
              <VenueEditPage />
            </PermissionRoute>
          }
        />

        {/* Hub: Socios */}
        <Route
          path="/socios"
          element={
            <PermissionRoute permission="membership-plans.view">
              <SociosPage />
            </PermissionRoute>
          }
        />
        <Route path="/planes-membresia" element={<Navigate to="/socios?tab=planes" replace />} />
        <Route path="/membresias-socios" element={<Navigate to="/socios?tab=membresias" replace />} />

        {/* Membership Plans CRUD */}
        <Route
          path="/planes-membresia/create"
          element={
            <PermissionRoute permission="membership-plans.manage">
              <MembershipPlanCreatePage />
            </PermissionRoute>
          }
        />
        <Route
          path="/planes-membresia/:id/edit"
          element={
            <PermissionRoute permission="membership-plans.manage">
              <MembershipPlanEditPage />
            </PermissionRoute>
          }
        />

        {/* Venue Schedules */}
        <Route
          path="/horarios/create"
          element={
            <PermissionRoute permission="venue-schedules.manage">
              <VenueScheduleCreatePage />
            </PermissionRoute>
          }
        />
        <Route
          path="/horarios/:id/edit"
          element={
            <PermissionRoute permission="venue-schedules.manage">
              <VenueScheduleEditPage />
            </PermissionRoute>
          }
        />
        <Route
          path="/horarios/slots"
          element={
            <PermissionRoute permission="venue-schedules.view">
              <SlotsViewPage />
            </PermissionRoute>
          }
        />

        {/* Blocked Periods */}
        <Route
          path="/periodos-bloqueados/create"
          element={
            <PermissionRoute permission="blocked-periods.manage">
              <BlockedPeriodCreatePage />
            </PermissionRoute>
          }
        />
        <Route
          path="/periodos-bloqueados/:id/edit"
          element={
            <PermissionRoute permission="blocked-periods.manage">
              <BlockedPeriodEditPage />
            </PermissionRoute>
          }
        />

        {/* Hub: Reservas */}
        <Route
          path="/reservas"
          element={
            <PermissionRoute permission="bookings.view">
              <ReservasHubPage />
            </PermissionRoute>
          }
        />
        <Route path="/servicios-adicionales" element={<Navigate to="/reservas?tab=servicios" replace />} />
        <Route path="/validar-qr" element={<Navigate to="/reservas?tab=validar-qr" replace />} />

        {/* Additional Services */}
        <Route
          path="/servicios-adicionales/create"
          element={
            <PermissionRoute permission="additional-services.manage">
              <AdditionalServiceCreatePage />
            </PermissionRoute>
          }
        />
        <Route
          path="/servicios-adicionales/:id/edit"
          element={
            <PermissionRoute permission="additional-services.manage">
              <AdditionalServiceEditPage />
            </PermissionRoute>
          }
        />

        {/* Bookings */}
        <Route
          path="/reservas/nueva"
          element={
            <BookingRoute>
              <BookingSearchPage />
            </BookingRoute>
          }
        />
        <Route
          path="/mis-reservas"
          element={
            <BookingRoute>
              <MyBookingsPage />
            </BookingRoute>
          }
        />

        {/* Hub: Finanzas */}
        <Route
          path="/finanzas"
          element={
            <PermissionRoute permission="payments.view">
              <FinanzasPage />
            </PermissionRoute>
          }
        />
        <Route path="/pagos" element={<Navigate to="/finanzas?tab=pagos" replace />} />
        <Route path="/motor-precios" element={<Navigate to="/finanzas?tab=motor-precios" replace />} />

        {/* User Memberships */}
        <Route
          path="/membresias-socios/create"
          element={
            <PermissionRoute permission="user-memberships.manage">
              <UserMembershipCreatePage />
            </PermissionRoute>
          }
        />

        {/* QR Validator */}

        {/* Condition Types CRUD */}
        <Route
          path="/tipos-condicion/create"
          element={
            <PermissionRoute permission="condition-types.manage">
              <ConditionTypeCreatePage />
            </PermissionRoute>
          }
        />
        <Route
          path="/tipos-condicion/:id/edit"
          element={
            <PermissionRoute permission="condition-types.manage">
              <ConditionTypeEditPage />
            </PermissionRoute>
          }
        />


        {/* Portal del socio */}
        <Route path="/mi-perfil" element={<MyProfilePage />} />
        <Route path="/mi-membresia" element={<MyMembershipPage />} />
        <Route path="/mi-billetera" element={<MyWalletPage />} />
        <Route path="/mis-pagos" element={<MisPagosPage />} />

        {/* Complete Profile */}
        <Route path="/completar-perfil" element={<CompleteProfilePage />} />

        {/* Hub: Configuración */}
        <Route
          path="/configuracion"
          element={
            <PermissionRoute permission="users.view">
              <ConfiguracionPage />
            </PermissionRoute>
          }
        />
        <Route path="/seguridad" element={<Navigate to="/configuracion?tab=seguridad" replace />} />
        <Route path="/sistema" element={<Navigate to="/configuracion?tab=sistema" replace />} />

        <Route path="/" element={<Navigate to="/inicio" replace />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/inicio" replace />} />
    </Routes>
  );
}

export default App;
