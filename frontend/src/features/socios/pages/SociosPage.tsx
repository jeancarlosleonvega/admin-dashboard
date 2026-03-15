import { useSearchParams } from 'react-router-dom';
import { CreditCard, UserCheck } from 'lucide-react';
import { cn } from '@lib/utils';
import { useAuthStore } from '@stores/authStore';
import MembershipPlansListPage from '@features/membership-plans/pages/MembershipPlansListPage';
import UserMembershipsPage from '@features/user-memberships/pages/UserMembershipsPage';

const navItems = [
  { id: 'planes', label: 'Planes', title: 'Planes de Membresía', icon: CreditCard, permission: 'membership-plans.view', subtitle: 'Gestionar planes y precios de membresía' },
  { id: 'membresias', label: 'Membresías', title: 'Membresías Socios', icon: UserCheck, permission: 'user-memberships.view', subtitle: 'Asignar y gestionar membresías de socios' },
];

export default function SociosPage() {
  const [params, setParams] = useSearchParams();
  const activeTab = params.get('tab') || 'planes';
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
        {activeTab === 'planes' && <MembershipPlansListPage />}
        {activeTab === 'membresias' && <UserMembershipsPage />}
      </div>
    </div>
  );
}
