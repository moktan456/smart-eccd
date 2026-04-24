import { useEffect, useState } from 'react';
import { dashboardService } from '../../services/dashboard.service';
import Card, { StatCard } from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import BloomBarChart from '../../components/charts/BloomBarChart';
import { BLOOM_LEVELS, BLOOM_COLORS, BLOOM_LABELS } from '../../utils/constants';

// Radial gauge for a single Bloom level %
const BloomGauge = ({ level, value }) => {
  const pct = Math.min(value, 100);
  const stroke = BLOOM_COLORS[level];
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} fill="none" stroke="#f3f4f6" strokeWidth="7" />
        <circle
          cx="36" cy="36" r={r} fill="none"
          stroke={stroke} strokeWidth="7"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 36 36)"
        />
        <text x="36" y="40" textAnchor="middle" fontSize="13" fontWeight="700" fill={stroke}>{pct}%</text>
      </svg>
      <span className="text-xs font-medium text-gray-600">{BLOOM_LABELS[level]}</span>
    </div>
  );
};

const SaDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService.getSuperAdminStats()
      .then(({ data }) => setStats(data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner className="mt-20" />;

  // Aggregate Bloom coverage across all centers
  const bloomTotals = {};
  (stats?.centers || []).forEach(c => {
    if (c.bloomCoverage) {
      Object.entries(c.bloomCoverage).forEach(([level, info]) => {
        if (!bloomTotals[level]) bloomTotals[level] = [];
        bloomTotals[level].push(typeof info === 'object' ? info.percentage : info);
      });
    }
  });
  const avgBloom = {};
  BLOOM_LEVELS.forEach(l => {
    const vals = bloomTotals[l] || [];
    avgBloom[l] = vals.length ? Math.round(vals.reduce((a,b)=>a+b,0)/vals.length) : 0;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Platform-wide overview · Bloom's Taxonomy MSP</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Centers" value={stats?.totalCenters ?? '—'} icon="🏫" />
        <StatCard label="Total Users"    value={stats?.totalUsers ?? '—'}   icon="👥" />
        <StatCard label="Children"       value={stats?.totalChildren ?? '—'} icon="🧒" />
        <StatCard label="Published Activities" value={stats?.totalActivities ?? '—'} icon="📋" />
      </div>

      {/* Bloom's MSP – Gauges */}
      <Card title="Platform-Wide Bloom's Coverage (avg. across all centers)">
        <div className="flex flex-wrap justify-around gap-4 py-2">
          {BLOOM_LEVELS.map(l => (
            <BloomGauge key={l} level={l} value={avgBloom[l] || 0} />
          ))}
        </div>
        <p className="text-xs text-gray-400 text-center mt-2">
          Scores below 10% indicate under-utilised cognitive levels that need more activity design.
        </p>
      </Card>

      {/* Bloom bar chart full */}
      <Card title="Bloom's Activity Distribution (all centers)">
        <BloomBarChart coverage={Object.fromEntries(BLOOM_LEVELS.map(l => [l, { percentage: avgBloom[l] || 0, isUnderUtilised: (avgBloom[l]||0) < 10 }]))} />
      </Card>

      {/* Centers overview */}
      <Card title="Centers Overview">
        <div className="space-y-3">
          {(stats?.centers || []).map(c => (
            <div key={c.id} className="p-3 rounded-xl border border-gray-100 hover:border-primary-200 transition-colors">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-sm text-gray-900">{c.name}</p>
                  <p className="text-xs text-gray-500">{c._count?.children ?? 0} children · {c._count?.classes ?? 0} classes</p>
                </div>
                <span className="text-xs text-gray-400">{c.address}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default SaDashboard;
