import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Shield, Key, Settings, LogOut } from 'lucide-react';
import { cn } from '@lib/utils';
import { useAuthStore } from '@stores/authStore';

const tooltip =
  'absolute left-full ml-2 px-3 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-lg shadow-lg shadow-primary-600/25 pointer-events-none opacity-0 invisible translate-x-2 group-hover:opacity-100 group-hover:visible group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap z-50';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: 'dashboard.view' },
  { name: 'Users', href: '/users', icon: Users, permission: 'users.view' },
  { name: 'Roles', href: '/roles', icon: Shield, permission: 'roles.view' },
  { name: 'Permissions', href: '/permissions', icon: Key, permission: 'roles.view' },
];

export default function Sidebar() {
  const { can, user, logout } = useAuthStore();
  const navigate = useNavigate();

  const filteredNav = navigation.filter(
    (item) => !item.permission || can(item.permission)
  );

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = user
    ? `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase()
    : '?';

  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-20 lg:flex-col z-20">
      <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
        {/* Logo */}
        <div className="flex items-center justify-center h-16 border-b border-gray-200 flex-shrink-0">
          <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">G</span>
          </div>
        </div>

        {/* Section label */}
        <div className="px-2 pt-5 pb-2 flex-shrink-0">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block text-center">
            Main
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 space-y-1">
          {filteredNav.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'relative flex items-center justify-center w-full h-11 rounded-lg transition-colors group',
                  isActive
                    ? 'text-primary-600'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-primary-600" />
                  )}
                  <item.icon className="w-5 h-5" />
                  <span className={tooltip}>{item.name}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="px-2 py-3 space-y-1 border-t border-gray-200 flex-shrink-0">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn(
                'relative flex items-center justify-center w-full h-11 rounded-lg transition-colors group',
                isActive
                  ? 'text-primary-600'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-primary-600" />
                )}
                <Settings className="w-5 h-5" />
                <span className={tooltip}>Settings</span>
              </>
            )}
          </NavLink>

          <button
            onClick={handleLogout}
            className="relative flex items-center justify-center w-full h-11 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors group"
          >
            <LogOut className="w-5 h-5" />
            <span className={tooltip}>Logout</span>
          </button>
        </div>

        {/* User avatar */}
        <div className="flex items-center justify-center py-4 border-t border-gray-200 flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center cursor-default group relative">
            <span className="text-sm font-semibold text-primary-700">{initials}</span>
            <span className={tooltip}>
              {user?.firstName} {user?.lastName}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
