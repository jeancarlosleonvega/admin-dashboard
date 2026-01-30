import { ReactNode } from 'react';
import { useAuthStore } from '@stores/authStore';

interface PermissionGateProps {
  /**
   * Single permission or array of permissions required
   * Format: "resource.action" (e.g., "users.edit")
   */
  permission: string | string[];

  /**
   * If true, user must have ALL permissions in array
   * If false, user only needs ANY one permission
   * Default: false
   */
  requireAll?: boolean;

  /**
   * Content to show when user lacks permissions
   * Default: null (hides content)
   */
  fallback?: ReactNode;

  /**
   * Content to show when user has permissions
   */
  children: ReactNode;
}

/**
 * PermissionGate Component
 *
 * Conditionally renders children based on user permissions.
 *
 * @example
 * // Single permission
 * <PermissionGate permission="users.edit">
 *   <EditButton />
 * </PermissionGate>
 *
 * @example
 * // Multiple permissions (needs ANY)
 * <PermissionGate permission={["users.edit", "users.delete"]}>
 *   <ActionButton />
 * </PermissionGate>
 *
 * @example
 * // Multiple permissions (needs ALL)
 * <PermissionGate permission={["users.view", "users.edit"]} requireAll>
 *   <EditForm />
 * </PermissionGate>
 *
 * @example
 * // With fallback
 * <PermissionGate
 *   permission="users.delete"
 *   fallback={<span>No permission</span>}
 * >
 *   <DeleteButton />
 * </PermissionGate>
 */
export default function PermissionGate({
  permission,
  requireAll = false,
  fallback = null,
  children,
}: PermissionGateProps) {
  const { can, canAny, canAll } = useAuthStore();

  // Handle single permission
  if (typeof permission === 'string') {
    return can(permission) ? <>{children}</> : <>{fallback}</>;
  }

  // Handle multiple permissions
  const hasPermission = requireAll
    ? canAll(permission)
    : canAny(permission);

  return hasPermission ? <>{children}</> : <>{fallback}</>;
}
