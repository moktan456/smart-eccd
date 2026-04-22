import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../../services/dashboard.service';
import api from '../../services/api';
import Card from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import BloomRadarChart from '../../components/charts/BloomRadarChart';
import TrendLineChart from '../../components/charts/TrendLineChart';
import { formatDate } from '../../utils/helpers';

const ParentDashboard = () => {
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [data, setData] = useState(null);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/children').then(({ data }) => {
      setChildren(data.data);
      if (data.data.length > 0) setSelectedChild(data.data[0]);
    });
  }, []);

  useEffect(() => {
    if (\!selectedChild) return;
    setLoading(true);
    Promise.all([
      dashboardService.getParentDashboard(selectedChild.id),
      api.get(`/performance/child/${selectedChild.id}/trend`),
    ]).then(([dashRes, trendRes]) => {
      setData(dashRes.data.data);
      setTrend(trendRes.data.data);
    }).finally(() => setLoading(false));
  }, [selectedChild?.id]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Child's Progress</h1>
        {children.length > 1 && (
          <div className="flex gap-2">
            {children.map(c => (
              <button key={c.id}
                onClick={() => setSelectedChild(c)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedChild?.id === c.id ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                {c.firstName}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? <LoadingSpinner className="mt-20" /> : data && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Bloom's Profile">
              <BloomRadarChart profile={data.bloomProfile} height={260} />
            </Card>
            <Card title="Progress Trend (8 weeks)">
              <TrendLineChart data={trend} height={260} levels={['REMEMBER', 'UNDERSTAND', 'APPLY']} />
            </Card>
          </div>

          <Card title="Recent Activities">
            <div className="space-y-3">
              {data.recentPerformances?.length === 0 ? (
                <p className="text-gray-500 text-sm">No activities recorded yet.</p>
              ) : data.recentPerformances?.map(p => (
                <div key={p.id} className="flex justify-between items-start py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{p.record?.assignment?.activity?.title}</p>
                    <p className="text-xs text-gray-500">{formatDate(p.createdAt)}</p>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">{p.bloomLevelAchieved}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Attendance This Month">
            <div className="flex gap-6">
              {data.attendanceSummary?.map(s => (
                <div key={s.status} className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{s._count}</p>
                  <p className="text-xs text-gray-500">{s.status}</p>
                </div>
              ))}
            </div>
          </Card>

          {selectedChild && (
            <div className="flex gap-3">
              <Link to={`/parent/child/${selectedChild.id}/performance`} className="btn-secondary text-sm">Full Performance →</Link>
              <Link to={`/parent/child/${selectedChild.id}/attendance`} className="btn-secondary text-sm">Attendance Calendar →</Link>
            </div>
          )}
        </>
      )}
    </div>
  );
};
export default ParentDashboard;
