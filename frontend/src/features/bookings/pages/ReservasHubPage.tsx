import { useSearchParams } from 'react-router-dom';
import { Calendar, Package, QrCode } from 'lucide-react';
import { Tabs, TabPanel } from '@components/ui/Tabs';
import type { TabDef } from '@components/ui/Tabs';
import AdminBookingsPage from './AdminBookingsPage';
import AdditionalServicesListPage from '@features/additional-services/pages/AdditionalServicesListPage';
import QRValidatorPage from '@features/qr/pages/QRValidatorPage';

const tabs: TabDef[] = [
  { id: 'reservas', label: 'Reservas', icon: Calendar, permission: 'bookings.view' },
  { id: 'servicios', label: 'Servicios Adicionales', icon: Package, permission: 'additional-services.view' },
  { id: 'validar-qr', label: 'Validar QR', icon: QrCode, permission: 'qr.validate' },
];

export default function ReservasHubPage() {
  const [params, setParams] = useSearchParams();
  const activeTab = params.get('tab') || 'reservas';

  return (
    <div>
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={(tab) => setParams({ tab })} />
      <TabPanel id="reservas" activeTab={activeTab}>
        <AdminBookingsPage />
      </TabPanel>
      <TabPanel id="servicios" activeTab={activeTab}>
        <AdditionalServicesListPage />
      </TabPanel>
      <TabPanel id="validar-qr" activeTab={activeTab}>
        <QRValidatorPage />
      </TabPanel>
    </div>
  );
}
