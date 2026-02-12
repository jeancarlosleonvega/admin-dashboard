import { NavLink, useNavigate, Link } from 'react-router-dom';
import { LayoutDashboard, Users, Shield, Key, Settings, LogOut, PanelLeftClose, PanelLeft } from 'lucide-react';
import { cn } from '@lib/utils';
import { useAuthStore } from '@stores/authStore';
import { useUIStore } from '@stores/uiStore';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: 'dashboard.view' },
];

const tooltipClass =
  'absolute left-full ml-2 px-3 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-lg shadow-lg shadow-primary-600/25 pointer-events-none opacity-0 invisible translate-x-2 group-hover:opacity-100 group-hover:visible group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap z-50';

export default function Sidebar() {
  const { can, user, logout } = useAuthStore();
  const { sidebarOpen, mobileSidebarOpen, closeMobileSidebar, toggleSidebar } = useUIStore();
  const navigate = useNavigate();

  const filteredNav = navigation.filter(
    (item) => !item.permission || can(item.permission)
  );

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleNavClick = () => {
    closeMobileSidebar();
  };

  const initials = user
    ? `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase()
    : '?';

  const expanded = sidebarOpen;

  return (
    <>
      {/* Mobile overlay backdrop */}
      {mobileSidebarOpen && (
        <div
          onClick={closeMobileSidebar}
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col bg-white border-r border-gray-200 transition-all duration-300',
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0',
          'w-64',
          expanded ? 'lg:w-64' : 'lg:w-20'
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            'flex items-center h-16 border-b border-gray-200 flex-shrink-0 transition-all duration-300',
            'px-4 gap-3',
            expanded ? 'lg:px-4 lg:gap-3' : 'lg:px-2 lg:gap-0 lg:justify-center'
          )}
        >
          <Link to="/dashboard" className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-lg">G</span>
            </div>
            <span
              className={cn(
                'text-lg font-bold text-gray-900 transition-all duration-300 overflow-hidden whitespace-nowrap',
                expanded ? 'lg:opacity-100 lg:w-auto' : 'lg:opacity-0 lg:w-0'
              )}
            >
              Admin
            </span>
          </Link>
          {/* Desktop toggle button */}
          <button
            onClick={toggleSidebar}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 items-center justify-center hidden lg:flex"
            title={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {expanded ? (
              <PanelLeftClose className="w-4 h-4" />
            ) : (
              <PanelLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Section label */}
        <div className={cn('pt-5 pb-2 flex-shrink-0', expanded ? 'lg:px-4' : 'lg:px-2', 'px-4')}>
          <span
            className={cn(
              'text-[10px] font-semibold text-gray-400 uppercase tracking-wider block',
              expanded ? 'lg:text-left' : 'lg:text-center'
            )}
          >
            {expanded ? <span className="hidden lg:inline">Main Navigation</span> : <span className="hidden lg:inline">Main</span>}
            <span className="lg:hidden">Main Navigation</span>
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 space-y-1">
          {filteredNav.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={handleNavClick}
              className={({ isActive }) =>
                cn(
                  'relative flex items-center w-full h-11 rounded-lg transition-colors group',
                  expanded ? 'lg:px-3 lg:gap-3' : 'lg:justify-center lg:px-0 lg:gap-0',
                  'px-3 gap-3',
                  isActive
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-primary-600" />
                  )}
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span
                    className={cn(
                      'text-sm font-medium transition-all duration-300 overflow-hidden whitespace-nowrap',
                      expanded ? 'lg:opacity-100 lg:w-auto' : 'lg:opacity-0 lg:w-0'
                    )}
                  >
                    {item.name}
                  </span>
                  {!expanded && (
                    <span className={cn(tooltipClass, 'hidden lg:block')}>{item.name}</span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="px-2 py-3 space-y-1 border-t border-gray-200 flex-shrink-0">
          <NavLink
            to="/settings"
            onClick={handleNavClick}
            className={({ isActive }) =>
              cn(
                'relative flex items-center w-full h-11 rounded-lg transition-colors group',
                expanded ? 'lg:px-3 lg:gap-3' : 'lg:justify-center lg:px-0 lg:gap-0',
                'px-3 gap-3',
                isActive
                  ? 'text-primary-600 bg-primary-50'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-primary-600" />
                )}
                <Settings className="w-5 h-5 flex-shrink-0" />
                <span
                  className={cn(
                    'text-sm font-medium transition-all duration-300 overflow-hidden whitespace-nowrap',
                    expanded ? 'lg:opacity-100 lg:w-auto' : 'lg:opacity-0 lg:w-0'
                  )}
                >
                  Settings
                </span>
                {!expanded && (
                  <span className={cn(tooltipClass, 'hidden lg:block')}>Settings</span>
                )}
              </>
            )}
          </NavLink>

          <button
            onClick={handleLogout}
            className={cn(
              'relative flex items-center w-full h-11 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors group',
              expanded ? 'lg:px-3 lg:gap-3' : 'lg:justify-center lg:px-0 lg:gap-0',
              'px-3 gap-3'
            )}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span
              className={cn(
                'text-sm font-medium transition-all duration-300 overflow-hidden whitespace-nowrap',
                expanded ? 'lg:opacity-100 lg:w-auto' : 'lg:opacity-0 lg:w-0'
              )}
            >
              Logout
            </span>
            {!expanded && (
              <span className={cn(tooltipClass, 'hidden lg:block')}>Logout</span>
            )}
          </button>
        </div>

        {/* User avatar */}
        <div
          className={cn(
            'flex items-center py-4 border-t border-gray-200 flex-shrink-0',
            expanded ? 'lg:px-4 lg:gap-3' : 'lg:justify-center lg:px-0 lg:gap-0',
            'px-4 gap-3'
          )}
        >
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 group relative">
            <span className="text-sm font-semibold text-primary-700">{initials}</span>
            {!expanded && (
              <span className={cn(tooltipClass, 'hidden lg:block')}>
                {user?.firstName} {user?.lastName}
              </span>
            )}
          </div>
          <div
            className={cn(
              'flex flex-col min-w-0 transition-all duration-300 overflow-hidden',
              expanded ? 'lg:opacity-100 lg:w-auto' : 'lg:opacity-0 lg:w-0'
            )}
          >
            <span className="text-sm font-medium text-gray-900 truncate">
              {user?.firstName} {user?.lastName}
            </span>
            <span className="text-xs text-gray-500 truncate">{user?.email}</span>
          </div>
        </div>
      </aside>
    </>
  );
}
