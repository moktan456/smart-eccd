import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../../services/dashboard.service';
import Card, { StatCard } from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/common/Button';
import { formatDate } from '../../utils/helpers';
import { BloomBadge } from '../../components/common/Badge';

const TeacherDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService.getTeacherToday().then(({ data }) => setData(data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner className="mt-20" />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
      <div className="grid grid-cols-2 gap-4">
        <StatCard label="My Class Size" value={data?.classInfo?._count?.children ?? '—'} />
        <StatCard label="Pending Activities" value={data?.pendingCount ?? 0} />
      </div>
      <Card title="Today's Activities">
        {data?.todayAssignments?.length === 0 ? (
          <p className="text-gray-500 text-sm py-4 text-center">No activities scheduled for today.</p>
        ) : (
          <div className="space-y-3">
            {data?.todayAssignments?.map(a => (
              <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">{a.activity?.title}</p>
                  <p className="text-xs text-gray-500">{a.class?.name} · {a.activity?.durationMins} min</p>
                  <div className="flex gap-1 mt-1">{a.activity?.bloomLevels?.map(l => <BloomBadge key={l} level={l} />)}</div>
                </div>
                <Link to={`/teacher/activities/${a.id}/conduct`}>
                  <Button size="sm">Conduct</Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
export default TeacherDashboard;
