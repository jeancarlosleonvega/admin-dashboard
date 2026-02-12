import { useSearchParams } from 'react-router-dom';
import { Users, Shield, Key } from 'lucide-react';
import { Tabs, TabPanel } from '@components/ui/Tabs';
import type { TabDef } from '@components/ui/Tabs';
import UsersListPage from '@features/users/pages/UsersListPage';
import RolesListPage from '@features/roles/pages/RolesListPage';
import PermissionsListPage from '@features/permissions/pages/PermissionsListPage';

const tabs: TabDef[] = [
  { id: 'users', label: 'Usuarios', icon: Users, permission: 'users.view' },
  { id: 'roles', label: 'Roles', icon: Shield, permission: 'roles.view' },
  { id: 'permissions', label: 'Permisos', icon: Key, permission: 'roles.view' },
];

export default function SettingsPage() {
  const [params, setParams] = useSearchParams();
  const activeTab = params.get('tab') || 'users';

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Manage users, roles, and system permissions</p>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={(tab) => setParams({ tab })} />

      <TabPanel id="users" activeTab={activeTab}>
        <UsersListPage />
      </TabPanel>
      <TabPanel id="roles" activeTab={activeTab}>
        <RolesListPage />
      </TabPanel>
      <TabPanel id="permissions" activeTab={activeTab}>
        <PermissionsListPage />
      </TabPanel>
    </div>
  );
}
