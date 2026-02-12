import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useUIStore } from '@stores/uiStore';
import { cn } from '@lib/utils';

export default function MainLayout() {
  const { sidebarOpen } = useUIStore();

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <Sidebar />
      <div
        className={cn(
          'transition-all duration-300',
          sidebarOpen ? 'lg:pl-64' : 'lg:pl-20'
        )}
      >
        <Topbar />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
