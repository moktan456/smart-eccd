import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { performanceService } from '../../services/performance.service';
import Card from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import BloomRadarChart from '../../components/charts/BloomRadarChart';
import TrendLineChart from '../../components/charts/TrendLineChart';
import { BloomBadge } from '../../components/common/Badge';
import { formatDate } from '../../utils/helpers';

const ParentPerformance = () => {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [performances, setPerformances] = useState([]);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      performanceService.getChildBloomProfile(id),
      performanceService.getChildPerformance(id, { limit: 20 }),
      performanceService.getChildTrend(id, { weeks: 12 }),
    ]).then(([p, perf, t]) => {
      setProfile(p.data.data);
      setPerformances(perf.data.data);
      setTrend(t.data.data);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner className="mt-20" />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Performance Details</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Bloom's Radar"><BloomRadarChart profile={profile} height={260} /></Card>
        <Card title="Progress Over Time"><TrendLineChart data={trend} height={260} /></Card>
      </div>
      <Card title="Activity History">
        <div className="space-y-3">
          {performances.map(p => (
            <div key={p.id} className="flex justify-between items-start py-2 border-b border-gray-100 last:border-0">
              <div>
                <p className="text-sm font-medium">{p.record?.assignment?.activity?.title}</p>
                <p className="text-xs text-gray-500">{formatDate(p.createdAt)} · {p.completionStatus}</p>
                {p.observationNotes && <p className="text-xs text-gray-600 mt-1 italic">"{p.observationNotes}"</p>}
              </div>
              <BloomBadge level={p.bloomLevelAchieved} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
export default ParentPerformance;
