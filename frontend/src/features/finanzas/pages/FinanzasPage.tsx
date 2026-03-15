import { useSearchParams } from 'react-router-dom';
import { DollarSign, TrendingUp } from 'lucide-react';
import { cn } from '@lib/utils';
import { useAuthStore } from '@stores/authStore';
import PaymentsPage from '@features/payments/pages/PaymentsPage';
import RevenueConfigPage from '@features/revenue/pages/RevenueConfigPage';

const navItems = [
  { id: 'pagos', label: 'Pagos', icon: DollarSign, permission: 'payments.view', subtitle: null },
  { id: 'motor-precios', label: 'Motor de Precios', icon: TrendingUp, permission: 'revenue.view', subtitle: null },
];

export default function FinanzasPage() {
  const [params, setParams] = useSearchParams();
  const activeTab = params.get('tab') || 'pagos';
  const { can } = useAuthStore();

  const visibleItems = navItems.filter((item) => !item.permission || can(item.permission));

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
        {activeTab === 'pagos' && <PaymentsPage />}
        {activeTab === 'motor-precios' && <RevenueConfigPage />}
      </div>
    </div>
  );
}
