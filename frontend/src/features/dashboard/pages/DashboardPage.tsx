import { Users, Shield, Key, Activity } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-500',
  INACTIVE: 'bg-gray-400',
  SUSPENDED: 'bg-orange-500',
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  SUSPENDED: 'Suspended',
};

function StatBar({ data, total }: { data: Record<string, number>; total: number }) {
  if (total === 0) return <div className="h-2 bg-gray-100 rounded-full" />;
  return (
    <div className="flex h-2 rounded-full overflow-hidden">
      {Object.entries(data).map(([key, value]) => (
        <div
          key={key}
          className={`${STATUS_COLORS[key] || 'bg-gray-300'}`}
          style={{ width: `${(value / total) * 100}%` }}
          title={`${STATUS_LABELS[key] || key}: ${value}`}
        />
      ))}
    </div>
  );
}

function StatLegend({ data }: { data: Record<string, number> }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
      {Object.entries(data).map(([key, value]) => (
        <div key={key} className="flex items-center gap-1.5 text-xs text-gray-600">
          <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[key] || 'bg-gray-300'}`} />
          <span>{STATUS_LABELS[key] || key}: <strong>{value}</strong></span>
        </div>
      ))}
    </div>
  );
}

const usersByStatus: Record<string, number> = {
  ACTIVE: 0,
  INACTIVE: 0,
  SUSPENDED: 0,
};

export default function DashboardPage() {
  const totalUsers = Object.values(usersByStatus).reduce((a, b) => a + b, 0);

  return (
    <div>
      {/* Header managed by Topbar */}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="bg-blue-500 p-3 rounded-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <p className="text-2xl font-semibold text-gray-900">0</p>
            </div>
          </div>
          <p className="text-xs text-green-600 mt-2">0 active</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="bg-green-500 p-3 rounded-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Roles</p>
              <p className="text-2xl font-semibold text-gray-900">0</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">System roles configured</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="bg-yellow-500 p-3 rounded-lg">
              <Key className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Permissions</p>
              <p className="text-2xl font-semibold text-gray-900">0</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Resource-action pairs</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="bg-purple-500 p-3 rounded-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Sessions This Month</p>
              <p className="text-2xl font-semibold text-gray-900">0</p>
            </div>
          </div>
          <p className="text-xs text-blue-600 mt-2">Current period</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Users by Status</h2>
          <StatBar data={usersByStatus} total={totalUsers} />
          <StatLegend data={usersByStatus} />
        </div>

        <div className="card p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Recent Activity</h2>
          <div className="text-center py-8 text-gray-500">
            <Activity className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No recent activity</p>
          </div>
        </div>
      </div>
    </div>
  );
}
