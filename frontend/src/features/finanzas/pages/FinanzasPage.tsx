import { useSearchParams } from 'react-router-dom';
import { DollarSign, TrendingUp } from 'lucide-react';
import { Tabs, TabPanel } from '@components/ui/Tabs';
import type { TabDef } from '@components/ui/Tabs';
import PaymentsPage from '@features/payments/pages/PaymentsPage';
import RevenueConfigPage from '@features/revenue/pages/RevenueConfigPage';

const tabs: TabDef[] = [
  { id: 'pagos', label: 'Pagos', icon: DollarSign, permission: 'payments.view' },
  { id: 'motor-precios', label: 'Motor de Precios', icon: TrendingUp, permission: 'revenue.view' },
];

export default function FinanzasPage() {
  const [params, setParams] = useSearchParams();
  const activeTab = params.get('tab') || 'pagos';

  return (
    <div>
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={(tab) => setParams({ tab })} />
      <TabPanel id="pagos" activeTab={activeTab}>
        <PaymentsPage />
      </TabPanel>
      <TabPanel id="motor-precios" activeTab={activeTab}>
        <RevenueConfigPage />
      </TabPanel>
    </div>
  );
}
