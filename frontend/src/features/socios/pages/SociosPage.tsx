import { useSearchParams } from 'react-router-dom';
import { CreditCard, UserCheck } from 'lucide-react';
import { Tabs, TabPanel } from '@components/ui/Tabs';
import type { TabDef } from '@components/ui/Tabs';
import MembershipPlansListPage from '@features/membership-plans/pages/MembershipPlansListPage';
import UserMembershipsPage from '@features/user-memberships/pages/UserMembershipsPage';

const tabs: TabDef[] = [
  { id: 'planes', label: 'Planes de Membresía', icon: CreditCard, permission: 'membership-plans.view' },
  { id: 'membresias', label: 'Membresías Socios', icon: UserCheck, permission: 'user-memberships.view' },
];

export default function SociosPage() {
  const [params, setParams] = useSearchParams();
  const activeTab = params.get('tab') || 'planes';

  return (
    <div>
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={(tab) => setParams({ tab })} />
      <TabPanel id="planes" activeTab={activeTab}>
        <MembershipPlansListPage />
      </TabPanel>
      <TabPanel id="membresias" activeTab={activeTab}>
        <UserMembershipsPage />
      </TabPanel>
    </div>
  );
}
