import { useEffect, useState } from 'react';
import { dashboardService } from '../../services/dashboard.service';
import { performanceService } from '../../services/performance.service';
import api from '../../services/api';
import Card, { StatCard } from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import BloomBarChart from '../../components/charts/BloomBarChart';
import BloomRadarChart from '../../components/charts/BloomRadarChart';
import Badge from '../../components/common/Badge';
import { BLOOM_LEVELS, BLOOM_COLORS, BLOOM_LABELS } from '../../utils/constants';

// Mini spark bar for a Bloom level score
const BloomMini = ({ level, value }) => (
  <div className="flex items-center gap-2">
    <span className="text-xs w-20 text-gray-600 truncate">{BLOOM_LABELS[level]}</span>
    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${value}%`, backgroundColor: BLOOM_COLORS[level] }}
      />
    </div>
    <span className="text-xs font-medium text-gray-700 w-8 text-right">{value}%</span>
  </div>
);

const MgrDashboard = () => {
  const [stats, setStats] = useState(null);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [classPerf, setClassPerf] = useState(null);
  const [loading, setLoading] = useState(true);
  const [classLoading, setClassLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      dashboardService.getCenterStats(),
      api.get('/classes'),
    ]).then(([statsRes, clsRes]) => {
      setStats(statsRes.data.data);
      setClasses(clsRes.data.data);
      if (clsRes.data.data.length > 0) setSelectedClass(clsRes.data.data[0]);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    setClassLoading(true);
    performanceService.getClassPerformance(selectedClass.id)
      .then(({ data }) => setClassPerf(data.data))
      .finally(() => setClassLoading(false));
  }, [selectedClass?.id]);

  if (loading) return <LoadingSpinner className="mt-20" />;

  const bloomCoverage = stats?.bloomCoverage || {};

  // Compute under-utilised levels
  const underUtilised = BLOOM_LEVELS.filter(l => {
    const info = bloomCoverage[l];
    return (typeof info === 'object' ? info.percentage : info || 0) < 10;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Center Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Center management · Bloom's Taxonomy MSP</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Children"   value={stats?.totalChildren}  icon="🧒" />
        <StatCard label="Classes"    value={stats?.totalClasses}   icon="📚" />
        <StatCard label="Teachers"   value={stats?.totalTeachers}  icon="👩‍🏫" />
        <StatCard label="Needs Attention" value={stats?.recentFlags ?? 0} icon="🚩" />
      </div>

      {/* Alert for under-utilised bloom levels */}
      {underUtilised.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="text-sm font-semibold text-amber-800">Bloom's Gap Alert</p>
            <p className="text-sm text-amber-700">
              The following cognitive levels are under-represented in your activity library (below 10%):{' '}
              {underUtilised.map(l => (
                <span key={l} className="font-semibold" style={{ color: BLOOM_COLORS[l] }}>{BLOOM_LABELS[l]} </span>
              ))}. Consider designing more activities targeting these levels.
            </p>
          </div>
        </div>
      )}

      {/* Bloom Coverage Chart */}
      <Card title="Bloom's Taxonomy Activity Coverage">
        <BloomBarChart coverage={bloomCoverage} />
      </Card>

      {/* Class-level Bloom breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Class Performance Drill-Down">
          {classes.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {classes.map(cls => (
                <button
                  key={cls.id}
                  onClick={() => setSelectedClass(cls)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${selectedClass?.id === cls.id ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  {cls.name}
                </button>
              ))}
            </div>
          )}
          {classLoading ? (
            <div className="h-32 flex items-center justify-center text-gray-400 text-sm">Loading…</div>
          ) : classPerf ? (
            <div className="space-y-2">
              {BLOOM_LEVELS.map(l => (
                <BloomMini key={l} level={l} value={classPerf.classAverage?.[l] ?? 0} />
              ))}
              <p className="text-xs text-gray-400 mt-3">
                Class average · {classPerf.children?.length ?? 0} students · {selectedClass?.teacher?.name || '—'}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">No performance data yet.</p>
          )}
        </Card>

        {/* Flagged children */}
        <Card title="Children Needing Attention">
          {!classPerf?.children?.length ? (
            <p className="text-sm text-gray-400 text-center py-6">No flags raised.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {(classPerf.children || [])
                .filter(c => BLOOM_LEVELS.some(l => (c.profile?.[l] ?? 0) < (classPerf.classAverage?.[l] ?? 0) * 0.8))
                .slice(0, 8)
                .map(({ child, profile }) => {
                  const weakestLevel = BLOOM_LEVELS.reduce((min, l) =>
                    (profile?.[l] ?? 0) < (profile?.[min] ?? 0) ? l : min, BLOOM_LEVELS[0]
                  );
                  return (
                    <div key={child.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold">
                          {child.firstName.charAt(0)}
                        </div>
                        <span className="text-sm font-medium">{child.firstName} {child.lastName}</span>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: BLOOM_COLORS[weakestLevel] }}>
                        Weak: {BLOOM_LABELS[weakestLevel]}
                      </span>
                    </div>
                  );
                })}
              {(classPerf.children || []).filter(c =>
                BLOOM_LEVELS.some(l => (c.profile?.[l] ?? 0) < (classPerf.classAverage?.[l] ?? 0) * 0.8)
              ).length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">All children performing at or above class average.</p>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Today's attendance */}
      <Card title="Today's Attendance">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">{stats?.todayAttendance ?? 0}</p>
            <p className="text-xs text-gray-500">Present Today</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-400">{stats?.totalChildren ?? 0}</p>
            <p className="text-xs text-gray-500">Enrolled</p>
          </div>
          {stats?.totalChildren > 0 && (
            <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${Math.round((stats.todayAttendance / stats.totalChildren) * 100)}%` }}
              />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default MgrDashboard;
