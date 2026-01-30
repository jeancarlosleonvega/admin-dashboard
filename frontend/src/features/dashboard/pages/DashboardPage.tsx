import { Users, Shield, Activity, TrendingUp } from 'lucide-react';

const stats = [
  { name: 'Total Users', value: '0', icon: Users, color: 'bg-blue-500' },
  { name: 'Active Roles', value: '0', icon: Shield, color: 'bg-green-500' },
  { name: 'Active Sessions', value: '0', icon: Activity, color: 'bg-yellow-500' },
  { name: 'New This Month', value: '0', icon: TrendingUp, color: 'bg-purple-500' },
];

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.name} className="card p-6">
            <div className="flex items-center">
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="text-center py-12 text-gray-500">
          <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No recent activity</p>
        </div>
      </div>
    </div>
  );
}
