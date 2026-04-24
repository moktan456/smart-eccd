import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../../services/dashboard.service';
import { performanceService } from '../../services/performance.service';
import Card, { StatCard } from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import BloomRadarChart from '../../components/charts/BloomRadarChart';
import Button from '../../components/common/Button';
import { BloomBadge } from '../../components/common/Badge';
import { BLOOM_LEVELS, BLOOM_COLORS, BLOOM_LABELS } from '../../utils/constants';

const ChildBloomRow = ({ child, profile, classAverage }) => {
  const isFlagged = BLOOM_LEVELS.some(l =>
    (profile?.[l] ?? 0) < (classAverage?.[l] ?? 0) * 0.8
  );
  return (
    <div className={`p-2.5 rounded-xl border ${isFlagged ? 'border-red-200 bg-red-50/40' : 'border-gray-100'}`}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold flex-shrink-0">
            {child.firstName.charAt(0)}
          </div>
          <span className="text-xs font-medium">{child.firstName} {child.lastName}</span>
        </div>
        {isFlagged && <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-medium">↓ Below avg</span>}
      </div>
      <div className="flex gap-0.5">
        {BLOOM_LEVELS.map(l => (
          <div key={l} title={`${BLOOM_LABELS[l]}: ${profile?.[l] ?? 0}%`}
            className="flex-1 h-2.5 rounded-sm transition-all"
            style={{ backgroundColor: BLOOM_COLORS[l], opacity: profile?.[l] ? 0.25 + (profile[l] / 100) * 0.75 : 0.1 }}
          />
        ))}
      </div>
    </div>
  );
};

const TeacherDashboard = () => {
  const [data, setData] = useState(null);
  const [classPerf, setClassPerf] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService.getTeacherToday().then(async ({ data: d }) => {
      setData(d.data);
      if (d.data?.classInfo?.id) {
        const perfRes = await performanceService.getClassPerformance(d.data.classInfo.id).catch(() => null);
        if (perfRes) setClassPerf(perfRes.data.data);
      }
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner className="mt-20" />;

  const classAvg = classPerf?.classAverage || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">My class · Bloom's Taxonomy performance</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Class Size"         value={data?.classInfo?._count?.children ?? '—'} icon="👶" />
        <StatCard label="Pending Activities" value={data?.pendingCount ?? 0}                  icon="📋" />
      </div>

      <Card title="Today's Schedule">
        {!data?.todayAssignments?.length ? (
          <p className="text-gray-400 text-sm text-center py-6">No activities scheduled for today.</p>
        ) : (
          <div className="space-y-3">
            {data.todayAssignments.map(a => (
              <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-medium text-sm">{a.activity?.title}</p>
                  <p className="text-xs text-gray-500">{a.class?.name} · {a.activity?.durationMins} min</p>
                  <div className="flex gap-1 mt-1">
                    {a.activity?.bloomLevels?.map(l => <BloomBadge key={l} level={l} />)}
                  </div>
                </div>
                <Link to={`/teacher/activities/${a.id}/conduct`}>
                  <Button size="sm">Conduct</Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </Card>

      {classPerf && (
        <Card title={`Class Bloom's Profile – ${data?.classInfo?.name || 'My Class'}`}>
          <BloomRadarChart profile={classAvg} height={260} />
          <p className="text-xs text-gray-400 text-center mt-1">Class average across all recorded activities</p>
        </Card>
      )}

      {classPerf?.children?.length > 0 && (
        <Card title="Student-Level Bloom Heatmap">
          <div className="flex flex-wrap gap-3 mb-3">
            {BLOOM_LEVELS.map(l => (
              <div key={l} className="flex items-center gap-1.5 text-xs">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: BLOOM_COLORS[l] }} />
                <span className="text-gray-500">{BLOOM_LABELS[l]}</span>
              </div>
            ))}
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {classPerf.children.map(({ child, profile }) => (
              <ChildBloomRow key={child.id} child={child} profile={profile} classAverage={classAvg} />
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">Darker bar = stronger performance. Red border = below class average.</p>
        </Card>
      )}
    </div>
  );
};

export default TeacherDashboard;
