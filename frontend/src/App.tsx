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

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
