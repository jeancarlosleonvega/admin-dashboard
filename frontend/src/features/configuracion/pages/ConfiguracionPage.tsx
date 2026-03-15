import { useSearchParams } from 'react-router-dom';
import { Shield, Settings } from 'lucide-react';
import { cn } from '@lib/utils';
import { useAuthStore } from '@stores/authStore';
import SettingsPage from '@features/settings/pages/SettingsPage';
import SystemConfigPage from '@features/settings/pages/SystemConfigPage';

const navItems = [
  { id: 'seguridad', label: 'Seguridad', icon: Shield, permission: 'users.view', subtitle: 'Gestionar usuarios, roles y permisos' },
  { id: 'sistema', label: 'Sistema', icon: Settings, permission: 'system-config.view', subtitle: 'Parámetros globales de configuración del sistema' },
];

export default function ConfiguracionPage() {
  const [params, setParams] = useSearchParams();
  const activeTab = params.get('tab') || 'seguridad';
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
            <h1 className="text-xl font-bold text-gray-900">{activeItem.label}</h1>
            <p className="text-sm text-gray-500 mt-1">{activeItem.subtitle}</p>
          </div>
        )}
        {activeTab === 'seguridad' && <SettingsPage />}
        {activeTab === 'sistema' && <SystemConfigPage />}
      </div>
    </div>
  );
}
