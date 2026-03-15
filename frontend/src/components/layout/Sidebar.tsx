import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard, MapPin, CreditCard, Calendar,
  PlusCircle, BookOpen, DollarSign, UserCheck,
  Wallet, TrendingUp, Shield, Settings,
} from 'lucide-react';
import { cn } from '@lib/utils';
import { useAuthStore } from '@stores/authStore';
import { useUIStore } from '@stores/uiStore';

type NavItem = { name: string; href: string; icon: React.ElementType; permission?: string };
type NavGroup = { label: string; items: NavItem[] };

const adminNavGroups: NavGroup[] = [
  {
    label: 'General',
    items: [
      { name: 'Inicio', href: '/inicio', icon: LayoutDashboard, permission: 'dashboard.view' },
    ],
  },
  {
    label: 'Gestión',
    items: [
      { name: 'Instalaciones', href: '/instalaciones', icon: MapPin, permission: 'sport-types.view' },
      { name: 'Socios', href: '/socios', icon: UserCheck, permission: 'membership-plans.view' },
      { name: 'Reservas', href: '/reservas', icon: Calendar, permission: 'bookings.view' },
    ],
  },
  {
    label: 'Finanzas',
    items: [
      { name: 'Pagos', href: '/pagos', icon: DollarSign, permission: 'payments.view' },
      { name: 'Motor de Precios', href: '/motor-precios', icon: TrendingUp, permission: 'revenue.view' },
    ],
  },
  {
    label: 'Configuración',
    items: [
      { name: 'Seguridad', href: '/seguridad', icon: Shield, permission: 'users.view' },
      { name: 'Sistema', href: '/sistema', icon: Settings, permission: 'system-config.view' },
    ],
  },
];

const baseClientNavGroups: NavGroup[] = [
  {
    label: 'Reservas',
    items: [
      { name: 'Nueva Reserva', href: '/reservas/nueva', icon: PlusCircle },
      { name: 'Mis Reservas', href: '/mis-reservas', icon: BookOpen },
    ],
  },
  {
    label: 'Mi Cuenta',
    items: [
      { name: 'Mi Membresía', href: '/mi-membresia', icon: CreditCard },
    ],
  },
];

const tooltipClass =
  'absolute left-full ml-2 px-3 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-lg shadow-lg shadow-primary-600/25 pointer-events-none opacity-0 invisible translate-x-2 group-hover:opacity-100 group-hover:visible group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap z-50';

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

function NavGroupSection({ group, expanded, onClick, can }: { group: NavGroup; expanded: boolean; onClick: () => void; can: (p?: string) => boolean }) {
  const visibleItems = group.items.filter((item) => !item.permission || can(item.permission));
  if (visibleItems.length === 0) return null;

  return (
    <div>
      {/* Group label */}
      <div className={cn('pt-4 pb-1', expanded ? 'lg:px-3 px-3' : 'lg:px-2 px-3')}>
        <span
          className={cn(
            'text-[10px] font-semibold text-gray-400 uppercase tracking-wider block transition-all duration-300',
            expanded ? 'lg:opacity-100' : 'lg:opacity-0 lg:h-0 lg:overflow-hidden lg:py-0'
          )}
        >
          <span className="lg:inline">{group.label}</span>
        </span>
        {!expanded && <div className="hidden lg:block h-px bg-gray-100 mt-1" />}
      </div>
      {/* Items */}
      <div className="space-y-0.5">
        {visibleItems.map((item) => (
          <NavItemLink key={item.href} item={item} expanded={expanded} onClick={onClick} />
        ))}
      </div>
    </div>
  );
}

export default function Sidebar() {
  const { can, user } = useAuthStore();
  const { sidebarOpen, mobileSidebarOpen, closeMobileSidebar } = useUIStore();

  const isStaffOrAdmin = can('users.view');

  const clientNavGroups: NavGroup[] = baseClientNavGroups.map((group) => {
    if (group.label === 'Mi Cuenta' && user?.walletEnabled) {
      return {
        ...group,
        items: [...group.items, { name: 'Mi Wallet', href: '/mi-billetera', icon: Wallet }],
      };
    }
    return group;
  });

  const navGroups = isStaffOrAdmin ? adminNavGroups : clientNavGroups;

  const handleNavClick = () => {
    closeMobileSidebar();
  };

  const expanded = sidebarOpen;

  return (
    <>
      {mobileSidebarOpen && (
        <div onClick={closeMobileSidebar} className="fixed inset-0 bg-black/50 z-30 lg:hidden" />
      )}

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

        {/* Navigation */}
        <nav className="flex-1 px-2 overflow-y-auto pb-4">
          {navGroups.map((group) => (
            <NavGroupSection
              key={group.label}
              group={group}
              expanded={expanded}
              onClick={handleNavClick}
              can={can}
            />
          ))}
        </nav>

      </aside>
    </>
  );
}
