import { Bell, Menu } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import { useUIStore } from '@stores/uiStore';

const routeTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/users': 'Users',
  '/users/create': 'Create User',
  '/roles': 'Roles',
  '/roles/create': 'Create Role',
  '/permissions': 'Permissions',
  '/permissions/create': 'Create Permission',
  '/settings': 'Settings',
};

function getPageTitle(pathname: string): string {
  if (routeTitles[pathname]) return routeTitles[pathname];
  if (/^\/users\/[^/]+\/edit$/.test(pathname)) return 'Edit User';
  if (/^\/roles\/[^/]+\/edit$/.test(pathname)) return 'Edit Role';
  if (/^\/permissions\/[^/]+\/edit$/.test(pathname)) return 'Edit Permission';
  return 'Dashboard';
}

export default function Topbar() {
  const location = useLocation();
  const pageTitle = getPageTitle(location.pathname);
  const { openMobileSidebar } = useUIStore();

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200 h-16">
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex items-center gap-3">
          {/* Mobile: logo */}
          <Link to="/dashboard" className="flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">G</span>
            </div>
            <span className="text-base font-bold text-gray-900">Admin</span>
          </Link>

          <h2 className="text-lg font-semibold text-gray-900 hidden lg:block">{pageTitle}</h2>
        </div>

        <div className="flex items-center gap-2">
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
    </header>
  );
}
