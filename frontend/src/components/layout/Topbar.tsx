import { useState, useRef, useEffect } from 'react';
import { Bell, Menu, PanelLeftClose, PanelLeft, User, LogOut } from 'lucide-react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useUIStore } from '@stores/uiStore';
import { usePageHeaderStore } from '@stores/pageHeaderStore';
import { useAuthStore } from '@stores/authStore';
import { cn } from '@lib/utils';

const routeTitles: Record<string, string> = {
  '/inicio': 'Inicio',
  '/usuarios': 'Usuarios',
  '/tipos-deporte': 'Tipos de Deporte',
  '/tipos-deporte/nuevo': 'Nuevo Tipo de Deporte',
  '/espacios': 'Espacios',
  '/espacios/nuevo': 'Nuevo Espacio',
  '/planes-membresia': 'Planes de Membresía',
  '/planes-membresia/nuevo': 'Nuevo Plan de Membresía',
  '/membresias-socios': 'Membresías Socios',
  '/membresias-socios/nuevo': 'Asignar Membresía',
  '/horarios': 'Horarios',
  '/horarios/nuevo': 'Nuevo Horario',
  '/periodos-bloqueados': 'Períodos Bloqueados',
  '/periodos-bloqueados/nuevo': 'Nuevo Período Bloqueado',
  '/tipos-condicion': 'Tipos de Condición',
  '/tipos-condicion/nuevo': 'Nuevo Tipo de Condición',
  '/servicios-adicionales': 'Servicios Adicionales',
  '/reservas': 'Reservas',
  '/reservas/nueva': 'Nueva Reserva',
  '/mis-reservas': 'Mis Reservas',
  '/pagos': 'Pagos',
  '/motor-precios': 'Motor de Precios',
  '/validar-qr': 'Validar QR',
  '/seguridad': 'Seguridad',
  '/sistema': 'Sistema',
  '/mi-perfil': 'Mi Perfil',
  '/mi-membresia': 'Mi Membresía',
  '/mi-billetera': 'Mi Billetera',
  '/completar-perfil': 'Completar Perfil',
};

function getPageTitle(pathname: string): string {
  if (routeTitles[pathname]) return routeTitles[pathname];
  if (/^\/usuarios\/[^/]+$/.test(pathname)) return 'Detalle de Usuario';
  if (/^\/tipos-deporte\/[^/]+$/.test(pathname)) return 'Detalle de Tipo de Deporte';
  if (/^\/espacios\/[^/]+$/.test(pathname)) return 'Detalle de Espacio';
  if (/^\/planes-membresia\/[^/]+$/.test(pathname)) return 'Detalle de Plan de Membresía';
  if (/^\/membresias-socios\/[^/]+$/.test(pathname)) return 'Detalle de Membresía';
  if (/^\/horarios\/[^/]+$/.test(pathname)) return 'Detalle de Horario';
  if (/^\/periodos-bloqueados\/[^/]+$/.test(pathname)) return 'Detalle de Período Bloqueado';
  if (/^\/tipos-condicion\/[^/]+$/.test(pathname)) return 'Detalle de Tipo de Condición';
  if (/^\/reservas\/[^/]+$/.test(pathname)) return 'Detalle de Reserva';
  return 'Inicio';
}

function UserMenu() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = user
    ? `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase()
    : '?';

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    navigate('/iniciar-sesion');
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg hover:bg-gray-100 p-1.5 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-semibold text-primary-700">{initials}</span>
        </div>
      </button>

      {open && (
        <div className={cn(
          'absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50',
        )}>
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>

          <Link
            to="/mi-perfil"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <User className="w-4 h-4 text-gray-400" />
            Mi Perfil
          </Link>

          <div className="border-t border-gray-100 mt-1 pt-1">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Salir
            </button>
          </div>
        </div>
      )}
    </div>
  );
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
          <Link to="/inicio" className="flex items-center gap-2 lg:hidden shrink-0">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">G</span>
            </div>
            <span className="text-base font-bold text-gray-900">Admin</span>
          </Link>

          {/* Desktop: sidebar toggle */}
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
            title={sidebarOpen ? 'Colapsar sidebar' : 'Expandir sidebar'}
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
            title="Notificaciones"
          >
            <Bell className="w-5 h-5" />
          </button>

          <UserMenu />

          {/* Mobile: hamburger menu */}
          <button
            onClick={openMobileSidebar}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
            title="Abrir menú"
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
