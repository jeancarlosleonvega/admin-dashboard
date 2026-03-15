import { useSearchParams } from 'react-router-dom';
import { Activity, MapPin, Clock, Ban, GitBranch } from 'lucide-react';
import { Tabs, TabPanel } from '@components/ui/Tabs';
import type { TabDef } from '@components/ui/Tabs';
import SportTypesListPage from '@features/sport-types/pages/SportTypesListPage';
import VenuesListPage from '@features/venues/pages/VenuesListPage';
import VenueSchedulesPage from '@features/venue-schedules/pages/VenueSchedulesPage';
import BlockedPeriodsListPage from '@features/blocked-periods/pages/BlockedPeriodsListPage';
import ConditionTypesListPage from '@features/condition-types/pages/ConditionTypesListPage';

const tabs: TabDef[] = [
  { id: 'tipos-deporte', label: 'Tipos de Deporte', icon: Activity, permission: 'sport-types.view' },
  { id: 'espacios', label: 'Espacios', icon: MapPin, permission: 'venues.view' },
  { id: 'horarios', label: 'Horarios', icon: Clock, permission: 'venue-schedules.view' },
  { id: 'periodos-bloqueados', label: 'Períodos Bloqueados', icon: Ban, permission: 'blocked-periods.view' },
  { id: 'tipos-condicion', label: 'Tipos de Condición', icon: GitBranch, permission: 'condition-types.view' },
];

export default function InstalacionesPage() {
  const [params, setParams] = useSearchParams();
  const activeTab = params.get('tab') || 'tipos-deporte';

  return (
    <div>
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={(tab) => setParams({ tab })} />
      <TabPanel id="tipos-deporte" activeTab={activeTab}>
        <SportTypesListPage />
      </TabPanel>
      <TabPanel id="espacios" activeTab={activeTab}>
        <VenuesListPage />
      </TabPanel>
      <TabPanel id="horarios" activeTab={activeTab}>
        <VenueSchedulesPage />
      </TabPanel>
      <TabPanel id="periodos-bloqueados" activeTab={activeTab}>
        <BlockedPeriodsListPage />
      </TabPanel>
      <TabPanel id="tipos-condicion" activeTab={activeTab}>
        <ConditionTypesListPage />
      </TabPanel>
    </div>
  );
}
