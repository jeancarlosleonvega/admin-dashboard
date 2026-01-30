import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@stores/authStore';

interface PermissionRouteProps {
  /**
   * Single permission or array of permissions required to access route
   * Format: "resource.action" (e.g., "users.view")
   */
  permission: string | string[];

  /**
   * If true, user must have ALL permissions in array
   * If false, user only needs ANY one permission
   * Default: false
   */
  requireAll?: boolean;

  /**
   * Path to redirect to when user lacks permissions
   * Default: "/dashboard"
   */
  redirectTo?: string;

  /**
   * Component to render when user has permissions
   */
  children: React.ReactNode;
}

/**
 * PermissionRoute Component
 *
 * Route guard that checks if user has required permissions.
 * Redirects to specified path if permissions are insufficient.
 *
 * Note: This assumes user is already authenticated.
 * Use ProtectedRoute wrapper for authentication checks first.
 *
 * @example
 * <Route
 *   path="/users"
 *   element={
 *     <ProtectedRoute>
 *       <PermissionRoute permission="users.view">
 *         <UsersListPage />
 *       </PermissionRoute>
 *     </ProtectedRoute>
 *   }
 * />
 *
 * @example
 * // Multiple permissions (needs ANY)
 * <PermissionRoute permission={["users.edit", "users.delete"]}>
 *   <UsersManagePage />
 * </PermissionRoute>
 *
 * @example
 * // Multiple permissions (needs ALL)
 * <PermissionRoute
 *   permission={["users.view", "users.edit"]}
 *   requireAll
 * >
 *   <UserEditPage />
 * </PermissionRoute>
 */
export default function PermissionRoute({
  permission,
  requireAll = false,
  redirectTo = '/dashboard',
  children,
}: PermissionRouteProps) {
  const { can, canAny, canAll, isAuthenticated } = useAuthStore();
  const location = useLocation();

  // If not authenticated, let ProtectedRoute handle it
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check permissions
  let hasPermission: boolean;

  if (typeof permission === 'string') {
    hasPermission = can(permission);
  } else {
    hasPermission = requireAll ? canAll(permission) : canAny(permission);
  }

  if (!hasPermission) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
