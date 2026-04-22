import { useEffect, useState } from 'react';
import { dashboardService } from '../../services/dashboard.service';
import Card, { StatCard } from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import BloomBarChart from '../../components/charts/BloomBarChart';

const MgrDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService.getCenterStats().then(({ data }) => setStats(data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner className="mt-20" />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Center Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Children" value={stats?.totalChildren} />
        <StatCard label="Classes" value={stats?.totalClasses} />
        <StatCard label="Teachers" value={stats?.totalTeachers} />
        <StatCard label="Flagged" value={stats?.recentFlags} />
      </div>
      <Card title="Bloom's Coverage This Month">
        <BloomBarChart coverage={stats?.bloomCoverage || {}} />
      </Card>
    </div>
  );
};
export default MgrDashboard;
