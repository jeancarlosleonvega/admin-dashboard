import { useSearchParams } from 'react-router-dom';
import { Activity, MapPin, Clock, Ban, GitBranch } from 'lucide-react';
import { cn } from '@lib/utils';
import { useAuthStore } from '@stores/authStore';
import SportTypesListPage from '@features/sport-types/pages/SportTypesListPage';
import VenuesListPage from '@features/venues/pages/VenuesListPage';
import VenueSchedulesPage from '@features/venue-schedules/pages/VenueSchedulesPage';
import BlockedPeriodsListPage from '@features/blocked-periods/pages/BlockedPeriodsListPage';
import ConditionTypesListPage from '@features/condition-types/pages/ConditionTypesListPage';

const navItems = [
  { id: 'tipos-deporte', label: 'Deportes', title: 'Tipos de Deporte', icon: Activity, permission: 'sport-types.view', subtitle: 'Gestionar tipos de deporte del club' },
  { id: 'espacios', label: 'Espacios', title: 'Espacios', icon: MapPin, permission: 'venues.view', subtitle: 'Gestionar espacios del club' },
  { id: 'horarios', label: 'Horarios', title: 'Horarios', icon: Clock, permission: 'venue-schedules.view', subtitle: 'Configurar horarios y disponibilidad' },
  { id: 'periodos-bloqueados', label: 'Bloqueados', title: 'Períodos Bloqueados', icon: Ban, permission: 'blocked-periods.view', subtitle: 'Gestionar períodos sin disponibilidad' },
  { id: 'tipos-condicion', label: 'Condiciones', title: 'Tipos de Condición', icon: GitBranch, permission: 'condition-types.view', subtitle: 'Condiciones aplicables a horarios y precios' },
];

export default function InstalacionesPage() {
  const [params, setParams] = useSearchParams();
  const activeTab = params.get('tab') || 'tipos-deporte';
  const { can } = useAuthStore();

  const visibleItems = navItems.filter((item) => !item.permission || can(item.permission));
  const activeItem = visibleItems.find((item) => item.id === activeTab) ?? visibleItems[0];

  return (
    <div className="flex gap-6 min-h-0">
      <aside className="w-48 flex-shrink-0">
        <nav className="space-y-0.5">
          {visibleItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setParams({ tab: item.id })}
                className={cn(
                  'flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left',
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                )}
              >
                <item.icon className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-primary-600' : 'text-gray-400')} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 min-w-0">
        {activeItem && (
          <div className="mb-6">
            <h1 className="text-xl font-bold text-gray-900">{activeItem.title}</h1>
            <p className="text-sm text-gray-500 mt-1">{activeItem.subtitle}</p>
          </div>
        )}
        {activeTab === 'tipos-deporte' && <SportTypesListPage />}
        {activeTab === 'espacios' && <VenuesListPage />}
        {activeTab === 'horarios' && <VenueSchedulesPage />}
        {activeTab === 'periodos-bloqueados' && <BlockedPeriodsListPage />}
        {activeTab === 'tipos-condicion' && <ConditionTypesListPage />}
      </div>
    </div>
  );
}
