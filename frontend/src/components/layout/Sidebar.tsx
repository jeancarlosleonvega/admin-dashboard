import React from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { LayoutDashboard, Settings, LogOut, Activity, MapPin, CreditCard, Calendar, PlusCircle, BookOpen, Clock, Ban, Package, DollarSign, UserCheck, QrCode, GitBranch, Wallet } from 'lucide-react';
import { cn } from '@lib/utils';
import { useAuthStore } from '@stores/authStore';
import { useUIStore } from '@stores/uiStore';

// Ítems de gestión: solo staff/admin (cada uno requiere su permiso)
const adminNav = [
  { name: 'Inicio', href: '/inicio', icon: LayoutDashboard, permission: 'dashboard.view' },
  { name: 'Tipos de Deporte', href: '/tipos-deporte', icon: Activity, permission: 'sport-types.view' },
  { name: 'Espacios', href: '/espacios', icon: MapPin, permission: 'venues.view' },
  { name: 'Planes de Membresía', href: '/planes-membresia', icon: CreditCard, permission: 'membership-plans.view' },
  { name: 'Membresías Socios', href: '/membresias-socios', icon: UserCheck, permission: 'user-memberships.view' },
  { name: 'Horarios', href: '/horarios', icon: Clock, permission: 'venue-schedules.view' },
  { name: 'Períodos Bloqueados', href: '/periodos-bloqueados', icon: Ban, permission: 'blocked-periods.view' },
  { name: 'Tipos de Condición', href: '/tipos-condicion', icon: GitBranch, permission: 'condition-types.view' },
  { name: 'Servicios Adicionales', href: '/servicios-adicionales', icon: Package, permission: 'additional-services.view' },
  { name: 'Reservas', href: '/reservas', icon: Calendar, permission: 'bookings.view' },
  { name: 'Pagos', href: '/pagos', icon: DollarSign, permission: 'payments.view' },
  { name: 'Validar QR', href: '/validar-qr', icon: QrCode, permission: 'qr.validate' },
];

// Ítems base del portal: solo clientes (no tienen users.view)
const baseClientNav = [
  { name: 'Nueva Reserva', href: '/reservas/nueva', icon: PlusCircle },
  { name: 'Mis Reservas', href: '/mis-reservas', icon: BookOpen },
  { name: 'Mi Membresía', href: '/mi-membresia', icon: CreditCard },
];

type NavItem = { name: string; href: string; icon: React.ElementType; permission?: string };

function NavItemLink({ item, expanded, onClick }: { item: NavItem; expanded: boolean; onClick: () => void }) {
  return (
    <NavLink
      to={item.href}
      onClick={onClick}
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
          {isActive && <div className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-primary-600" />}
          <item.icon className="w-5 h-5 flex-shrink-0" />
          <span className={cn('text-sm font-medium transition-all duration-300 overflow-hidden whitespace-nowrap', expanded ? 'lg:opacity-100 lg:w-auto' : 'lg:opacity-0 lg:w-0')}>
            {item.name}
          </span>
          {!expanded && <span className={cn(tooltipClass, 'hidden lg:block')}>{item.name}</span>}
        </>
      )}
    </NavLink>
  );
}

const tooltipClass =
  'absolute left-full ml-2 px-3 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-lg shadow-lg shadow-primary-600/25 pointer-events-none opacity-0 invisible translate-x-2 group-hover:opacity-100 group-hover:visible group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap z-50';

export default function Sidebar() {
  const { can, user, logout } = useAuthStore();
  const { sidebarOpen, mobileSidebarOpen, closeMobileSidebar } = useUIStore();
  const navigate = useNavigate();

  const isStaffOrAdmin = can('users.view');
  const filteredAdminNav = adminNav.filter((item) => can(item.permission));
  const clientNav = user?.walletEnabled
    ? [...baseClientNav, { name: 'Mi Wallet', href: '/mi-billetera', icon: Wallet }]
    : baseClientNav;

  const handleLogout = async () => {
    await logout();
    navigate('/iniciar-sesion');
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
            'flex items-center h-20 border-b border-gray-200 flex-shrink-0 transition-all duration-300',
            'px-4 gap-3',
            expanded ? 'lg:px-4 lg:gap-3' : 'lg:px-2 lg:gap-0 lg:justify-center'
          )}
        >
          <Link to="/inicio" className="flex items-center gap-3 flex-1 min-w-0">
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
        </div>

        {/* Section label */}
        <div className={cn('pt-5 pb-2 flex-shrink-0', expanded ? 'lg:px-4' : 'lg:px-2', 'px-4')}>
          <span
            className={cn(
              'text-[10px] font-semibold text-gray-400 uppercase tracking-wider block',
              expanded ? 'lg:text-left' : 'lg:text-center'
            )}
          >
            {expanded ? <span className="hidden lg:inline">Menú principal</span> : <span className="hidden lg:inline">Menú</span>}
            <span className="lg:hidden">Menú principal</span>
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
          {isStaffOrAdmin
            ? filteredAdminNav.map((item) => (
                <NavItemLink key={item.name} item={item} expanded={expanded} onClick={handleNavClick} />
              ))
            : clientNav.map((item) => (
                <NavItemLink key={item.name} item={item} expanded={expanded} onClick={handleNavClick} />
              ))
          }
        </nav>

        {/* Bottom section */}
        <div className="px-2 py-3 space-y-1 border-t border-gray-200 flex-shrink-0">
          <NavLink
            to="/configuracion"
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
                  Configuración
                </span>
                {!expanded && (
                  <span className={cn(tooltipClass, 'hidden lg:block')}>Configuración</span>
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
              Salir
            </span>
            {!expanded && (
              <span className={cn(tooltipClass, 'hidden lg:block')}>Salir</span>
            )}
          </button>
        </div>

        {/* User avatar → Mi Perfil */}
        <Link
          to="/mi-perfil"
          onClick={handleNavClick}
          className={cn(
            'flex items-center py-4 border-t border-gray-200 flex-shrink-0 hover:bg-gray-50 transition-colors',
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
        </Link>
      </aside>
    </>
  );
}
