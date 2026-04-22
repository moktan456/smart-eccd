import { useEffect, useState } from 'react';
import { dashboardService } from '../../services/dashboard.service';
import Card, { StatCard } from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import BloomBarChart from '../../components/charts/BloomBarChart';

const SaDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService.getSuperAdminStats()
      .then(({ data }) => setStats(data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner className="mt-20" />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Centers" value={stats?.totalCenters} />
        <StatCard label="Total Users" value={stats?.totalUsers} />
        <StatCard label="Total Children" value={stats?.totalChildren} />
        <StatCard label="Published Activities" value={stats?.totalActivities} />
      </div>
      <Card title="Recent Centers">
        <div className="space-y-2">
          {stats?.centers?.map(c => (
            <div key={c.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
              <span className="font-medium text-sm">{c.name}</span>
              <span className="text-xs text-gray-500">{c._count.children} children · {c._count.classes} classes</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
export default SaDashboard;
