import { Bell, Menu, PanelLeftClose, PanelLeft } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import { useUIStore } from '@stores/uiStore';
import { usePageHeaderStore } from '@stores/pageHeaderStore';

const routeTitles: Record<string, string> = {
  '/dashboard': 'Inicio',
  '/users': 'Usuarios',
  '/users/create': 'Crear Usuario',
  '/roles': 'Roles',
  '/roles/create': 'Crear Rol',
  '/permissions': 'Permisos',
  '/permissions/create': 'Crear Permiso',
  '/settings': 'Configuración',
};

function getPageTitle(pathname: string): string {
  if (routeTitles[pathname]) return routeTitles[pathname];
  if (/^\/users\/[^/]+\/edit$/.test(pathname)) return 'Edit User';
  if (/^\/users\/[^/]+$/.test(pathname)) return 'User Detail';
  if (/^\/roles\/[^/]+\/edit$/.test(pathname)) return 'Edit Role';
  if (/^\/roles\/[^/]+$/.test(pathname)) return 'Role Detail';
  if (/^\/permissions\/[^/]+\/edit$/.test(pathname)) return 'Edit Permission';
  if (/^\/permissions\/[^/]+$/.test(pathname)) return 'Permission Detail';
  return 'Dashboard';
}

export default function Topbar() {
  const location = useLocation();
  const routeTitle = getPageTitle(location.pathname);
  const { sidebarOpen, toggleSidebar, openMobileSidebar } = useUIStore();
  const { title, subtitle, actions } = usePageHeaderStore();

  const displayTitle = title ?? routeTitle;

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200 lg:h-20">
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile: logo */}
          <Link to="/dashboard" className="flex items-center gap-2 lg:hidden shrink-0">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">G</span>
            </div>
            <span className="text-base font-bold text-gray-900">Admin</span>
          </Link>

          {/* Desktop: sidebar toggle */}
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? (
              <PanelLeftClose className="w-6 h-6" />
            ) : (
              <PanelLeft className="w-6 h-6" />
            )}
          </button>

          {/* Desktop: title + subtitle */}
          <div className="hidden lg:block min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 truncate">{displayTitle}</h2>
            {subtitle && (
              <div className="text-sm text-gray-500 truncate">{subtitle}</div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Actions */}
          {actions && (
            <div className="flex items-center gap-2">{actions}</div>
          )}

          <button
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
          </button>

          {/* Mobile: hamburger menu */}
          <button
            onClick={openMobileSidebar}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
            title="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile: title + subtitle below the top bar row */}
      <div className="lg:hidden px-6 pb-3 -mt-1">
        <h2 className="text-lg font-semibold text-gray-900 truncate">{displayTitle}</h2>
        {subtitle && (
          <div className="text-sm text-gray-500 truncate">{subtitle}</div>
        )}
      </div>
    </header>
  );
}
