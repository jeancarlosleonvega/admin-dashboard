import { useSearchParams } from 'react-router-dom';
import { Shield, Settings } from 'lucide-react';
import { Tabs, TabPanel } from '@components/ui/Tabs';
import type { TabDef } from '@components/ui/Tabs';
import SettingsPage from '@features/settings/pages/SettingsPage';
import SystemConfigPage from '@features/settings/pages/SystemConfigPage';

const tabs: TabDef[] = [
  { id: 'seguridad', label: 'Seguridad', icon: Shield, permission: 'users.view' },
  { id: 'sistema', label: 'Sistema', icon: Settings, permission: 'system-config.view' },
];

export default function ConfiguracionPage() {
  const [params, setParams] = useSearchParams();
  const activeTab = params.get('tab') || 'seguridad';

  return (
    <div>
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={(tab) => setParams({ tab })} />
      <TabPanel id="seguridad" activeTab={activeTab}>
        <SettingsPage />
      </TabPanel>
      <TabPanel id="sistema" activeTab={activeTab}>
        <SystemConfigPage />
      </TabPanel>
    </div>
  );
}
