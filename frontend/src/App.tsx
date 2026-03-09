import { Routes, Route, Navigate } from 'react-router-dom';
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
import SettingsPage from '@features/settings/pages/SettingsPage';
import UserCreatePage from '@features/users/pages/UserCreatePage';
import UserDetailPage from '@features/users/pages/UserDetailPage';
import UserEditPage from '@features/users/pages/UserEditPage';
import RoleCreatePage from '@features/roles/pages/RoleCreatePage';
import RoleDetailPage from '@features/roles/pages/RoleDetailPage';
import RoleEditPage from '@features/roles/pages/RoleEditPage';
import PermissionCreatePage from '@features/permissions/pages/PermissionCreatePage';
import PermissionDetailPage from '@features/permissions/pages/PermissionDetailPage';
import PermissionEditPage from '@features/permissions/pages/PermissionEditPage';
import SportTypesListPage from '@features/sport-types/pages/SportTypesListPage';
import SportTypeCreatePage from '@features/sport-types/pages/SportTypeCreatePage';
import SportTypeEditPage from '@features/sport-types/pages/SportTypeEditPage';
import SportTypeDetailPage from '@features/sport-types/pages/SportTypeDetailPage';
import VenuesListPage from '@features/venues/pages/VenuesListPage';
import VenueCreatePage from '@features/venues/pages/VenueCreatePage';
import VenueEditPage from '@features/venues/pages/VenueEditPage';
import VenueDetailPage from '@features/venues/pages/VenueDetailPage';
import MembershipPlansListPage from '@features/membership-plans/pages/MembershipPlansListPage';
import MembershipPlanCreatePage from '@features/membership-plans/pages/MembershipPlanCreatePage';
import MembershipPlanEditPage from '@features/membership-plans/pages/MembershipPlanEditPage';
import VenueSchedulesPage from '@features/venue-schedules/pages/VenueSchedulesPage';
import VenueScheduleCreatePage from '@features/venue-schedules/pages/VenueScheduleCreatePage';
import VenueScheduleEditPage from '@features/venue-schedules/pages/VenueScheduleEditPage';
import BlockedPeriodsListPage from '@features/blocked-periods/pages/BlockedPeriodsListPage';
import BlockedPeriodCreatePage from '@features/blocked-periods/pages/BlockedPeriodCreatePage';
import BlockedPeriodEditPage from '@features/blocked-periods/pages/BlockedPeriodEditPage';
import AdditionalServicesListPage from '@features/additional-services/pages/AdditionalServicesListPage';
import AdditionalServiceCreatePage from '@features/additional-services/pages/AdditionalServiceCreatePage';
import AdditionalServiceEditPage from '@features/additional-services/pages/AdditionalServiceEditPage';
import AdminBookingsPage from '@features/bookings/pages/AdminBookingsPage';
import BookingFlowPage from '@features/bookings/pages/BookingFlowPage';
import MyBookingsPage from '@features/bookings/pages/MyBookingsPage';
import PendingTransfersPage from '@features/payments/pages/PendingTransfersPage';
import UserMembershipsPage from '@features/user-memberships/pages/UserMembershipsPage';
import UserMembershipCreatePage from '@features/user-memberships/pages/UserMembershipCreatePage';
import QRValidatorPage from '@features/qr/pages/QRValidatorPage';

// Route guards
import ProtectedRoute from '@/routes/ProtectedRoute';
import PermissionRoute from '@/routes/PermissionRoute';

// Components
import { Spinner } from '@components/ui/Spinner';

function App() {
  const { isAuthenticated, isLoading, initialize } = useAuthStore();

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
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
          }
        />
        <Route
          path="/register"
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />
          }
        />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
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
          path="/dashboard"
          element={
            <PermissionRoute permission="dashboard.view">
              <DashboardPage />
            </PermissionRoute>
          }
        />
        <Route
          path="/settings"
          element={<SettingsPage />}
        />

        {/* Users CRUD */}
        <Route
          path="/users"
          element={<Navigate to="/settings?tab=users" replace />}
        />
        <Route
          path="/users/create"
          element={
            <PermissionRoute permission="users.create">
              <UserCreatePage />
            </PermissionRoute>
          }
        />
        <Route
          path="/users/:id"
          element={
            <PermissionRoute permission="users.view">
              <UserDetailPage />
            </PermissionRoute>
          }
        />
        <Route
          path="/users/:id/edit"
          element={
            <PermissionRoute permission="users.edit">
              <UserEditPage />
            </PermissionRoute>
          }
        />

        {/* Roles CRUD */}
        <Route
          path="/roles"
          element={<Navigate to="/settings?tab=roles" replace />}
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
          element={<Navigate to="/settings?tab=permissions" replace />}
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

        {/* Sport Types CRUD */}
        <Route
          path="/sport-types"
          element={
            <PermissionRoute permission="sport-types.view">
              <SportTypesListPage />
            </PermissionRoute>
          }
        />
        <Route
          path="/sport-types/create"
          element={
            <PermissionRoute permission="sport-types.manage">
              <SportTypeCreatePage />
            </PermissionRoute>
          }
        />
        <Route
          path="/sport-types/:id"
          element={
            <PermissionRoute permission="sport-types.view">
              <SportTypeDetailPage />
            </PermissionRoute>
          }
        />
        <Route
          path="/sport-types/:id/edit"
          element={
            <PermissionRoute permission="sport-types.manage">
              <SportTypeEditPage />
            </PermissionRoute>
          }
        />

        {/* Venues CRUD */}
        <Route
          path="/venues"
          element={
            <PermissionRoute permission="venues.view">
              <VenuesListPage />
            </PermissionRoute>
          }
        />
        <Route
          path="/venues/create"
          element={
            <PermissionRoute permission="venues.manage">
              <VenueCreatePage />
            </PermissionRoute>
          }
        />
        <Route
          path="/venues/:id"
          element={
            <PermissionRoute permission="venues.view">
              <VenueDetailPage />
            </PermissionRoute>
          }
        />
        <Route
          path="/venues/:id/edit"
          element={
            <PermissionRoute permission="venues.manage">
              <VenueEditPage />
            </PermissionRoute>
          }
        />

        {/* Membership Plans CRUD */}
        <Route
          path="/membership-plans"
          element={
            <PermissionRoute permission="membership-plans.view">
              <MembershipPlansListPage />
            </PermissionRoute>
          }
        />
        <Route
          path="/membership-plans/create"
          element={
            <PermissionRoute permission="membership-plans.manage">
              <MembershipPlanCreatePage />
            </PermissionRoute>
          }
        />
        <Route
          path="/membership-plans/:id/edit"
          element={
            <PermissionRoute permission="membership-plans.manage">
              <MembershipPlanEditPage />
            </PermissionRoute>
          }
        />

        {/* Venue Schedules */}
        <Route
          path="/venue-schedules"
          element={
            <PermissionRoute permission="venue-schedules.view">
              <VenueSchedulesPage />
            </PermissionRoute>
          }
        />
        <Route
          path="/venue-schedules/create"
          element={
            <PermissionRoute permission="venue-schedules.manage">
              <VenueScheduleCreatePage />
            </PermissionRoute>
          }
        />
        <Route
          path="/venue-schedules/:id/edit"
          element={
            <PermissionRoute permission="venue-schedules.manage">
              <VenueScheduleEditPage />
            </PermissionRoute>
          }
        />

        {/* Blocked Periods */}
        <Route
          path="/blocked-periods"
          element={
            <PermissionRoute permission="blocked-periods.view">
              <BlockedPeriodsListPage />
            </PermissionRoute>
          }
        />
        <Route
          path="/blocked-periods/create"
          element={
            <PermissionRoute permission="blocked-periods.manage">
              <BlockedPeriodCreatePage />
            </PermissionRoute>
          }
        />
        <Route
          path="/blocked-periods/:id/edit"
          element={
            <PermissionRoute permission="blocked-periods.manage">
              <BlockedPeriodEditPage />
            </PermissionRoute>
          }
        />

        {/* Additional Services */}
        <Route
          path="/additional-services"
          element={
            <PermissionRoute permission="additional-services.view">
              <AdditionalServicesListPage />
            </PermissionRoute>
          }
        />
        <Route
          path="/additional-services/create"
          element={
            <PermissionRoute permission="additional-services.manage">
              <AdditionalServiceCreatePage />
            </PermissionRoute>
          }
        />
        <Route
          path="/additional-services/:id/edit"
          element={
            <PermissionRoute permission="additional-services.manage">
              <AdditionalServiceEditPage />
            </PermissionRoute>
          }
        />

        {/* Bookings */}
        <Route
          path="/bookings"
          element={
            <PermissionRoute permission="bookings.view">
              <AdminBookingsPage />
            </PermissionRoute>
          }
        />
        <Route path="/bookings/new" element={<BookingFlowPage />} />
        <Route path="/bookings/my" element={<MyBookingsPage />} />

        {/* Payments */}
        <Route
          path="/payments/transfers"
          element={
            <PermissionRoute permission="payments.view">
              <PendingTransfersPage />
            </PermissionRoute>
          }
        />

        {/* User Memberships */}
        <Route
          path="/user-memberships"
          element={
            <PermissionRoute permission="user-memberships.view">
              <UserMembershipsPage />
            </PermissionRoute>
          }
        />
        <Route
          path="/user-memberships/create"
          element={
            <PermissionRoute permission="user-memberships.manage">
              <UserMembershipCreatePage />
            </PermissionRoute>
          }
        />

        {/* QR Validator */}
        <Route
          path="/qr-validator"
          element={
            <PermissionRoute permission="qr.validate">
              <QRValidatorPage />
            </PermissionRoute>
          }
        />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
