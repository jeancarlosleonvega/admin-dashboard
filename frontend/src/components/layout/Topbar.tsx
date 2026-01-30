import { Bell } from 'lucide-react';
import { useLocation } from 'react-router-dom';

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

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200 h-16">
      <div className="flex items-center justify-between h-full px-6">
        <h2 className="text-lg font-semibold text-gray-900">{pageTitle}</h2>

        <button
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors relative"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
