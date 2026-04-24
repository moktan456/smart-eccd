import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../../services/dashboard.service';
import api from '../../services/api';
import Card, { StatCard } from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import BloomRadarChart from '../../components/charts/BloomRadarChart';
import TrendLineChart from '../../components/charts/TrendLineChart';
import Badge, { BloomBadge } from '../../components/common/Badge';
import { formatDate } from '../../utils/helpers';
import { BLOOM_LEVELS, BLOOM_COLORS, BLOOM_LABELS } from '../../utils/constants';

// Score card for a Bloom level
const BloomScoreCard = ({ level, score }) => {
  const pct = Math.min(score, 100);
  const r = 22;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const color = BLOOM_COLORS[level];

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="56" height="56" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={r} fill="none" stroke="#f3f4f6" strokeWidth="5" />
        <circle cx="28" cy="28" r={r} fill="none"
          stroke={color} strokeWidth="5"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 28 28)"
        />
        <text x="28" y="33" textAnchor="middle" fontSize="11" fontWeight="700" fill={color}>{pct}%</text>
      </svg>
      <span className="text-xs text-gray-500 text-center leading-tight">{BLOOM_LABELS[level]}</span>
    </div>
  );
};

const ParentDashboard = () => {
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [dashData, setDashData] = useState(null);
  const [trend, setTrend] = useState([]);
  const [feeRecords, setFeeRecords] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/children').then(({ data }) => {
      setChildren(data.data);
      if (data.data.length > 0) setSelectedChild(data.data[0]);
    });
  }, []);

  useEffect(() => {
    if (!selectedChild) return;
    setLoading(true);
    Promise.all([
      dashboardService.getParentDashboard(selectedChild.id),
      api.get(`/performance/child/${selectedChild.id}/trend`),
      api.get(`/fees/records?childId=${selectedChild.id}&limit=5`).catch(() => ({ data: { data: [] } })),
      api.get(`/leave?childId=${selectedChild.id}&limit=5`).catch(() => ({ data: { data: [] } })),
    ]).then(([dash, trendRes, fees, leaves]) => {
      setDashData(dash.data.data);
      setTrend(trendRes.data.data);
      setFeeRecords(fees.data.data);
      setLeaveRequests(leaves.data.data);
    }).finally(() => setLoading(false));
  }, [selectedChild?.id]);

  const FEE_COLOR = { PENDING: 'yellow', PAID: 'green', PARTIAL: 'blue', OVERDUE: 'red', WAIVED: 'gray' };
  const LEAVE_COLOR = { PENDING: 'yellow', APPROVED: 'green', REJECTED: 'red' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Child's Progress</h1>
          <p className="text-sm text-gray-500 mt-0.5">Bloom's Taxonomy performance overview</p>
        </div>
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

      {loading ? <LoadingSpinner className="mt-16" /> : dashData && (
        <>
          {/* Child info strip */}
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-primary-50 to-blue-50 rounded-2xl border border-primary-100">
            <div className="w-12 h-12 rounded-2xl bg-primary-200 flex items-center justify-center text-primary-800 text-xl font-bold">
              {selectedChild?.firstName?.charAt(0)}
            </div>
            <div>
              <p className="font-bold text-gray-900">{selectedChild?.firstName} {selectedChild?.lastName}</p>
              <p className="text-sm text-gray-600">Class: {dashData.child?.class?.name} · Teacher: {dashData.child?.class?.teacher?.name || '—'}</p>
              <p className="text-xs text-gray-400">Student ID: {selectedChild?.studentId}</p>
            </div>
          </div>

          {/* Bloom gauges – MSP highlight */}
          <Card title="Bloom's Taxonomy Profile">
            <div className="flex flex-wrap justify-around gap-3 py-2">
              {BLOOM_LEVELS.map(l => (
                <BloomScoreCard key={l} level={l} score={dashData.bloomProfile?.[l] ?? 0} />
              ))}
            </div>
            <p className="text-xs text-gray-400 text-center mt-3">
              Each ring shows how strongly your child demonstrates that cognitive skill (0–100%).
            </p>
          </Card>

          {/* Trend */}
          {trend.length > 0 && (
            <Card title="Learning Progress Trend (8 weeks)">
              <TrendLineChart data={trend} height={220} levels={['REMEMBER', 'UNDERSTAND', 'APPLY']} />
            </Card>
          )}

          {/* Radar */}
          <Card title="Bloom's Radar">
            <BloomRadarChart profile={dashData.bloomProfile || {}} height={250} />
          </Card>

          {/* Attendance this month */}
          <Card title="Attendance This Month">
            <div className="flex gap-6 flex-wrap">
              {dashData.attendanceSummary?.map(s => {
                const colors = { PRESENT: 'text-green-600', ABSENT: 'text-red-600', LATE: 'text-yellow-600', EXCUSED: 'text-blue-600' };
                return (
                  <div key={s.status} className="text-center">
                    <p className={`text-3xl font-bold ${colors[s.status] || 'text-gray-700'}`}>{s._count}</p>
                    <p className="text-xs text-gray-500">{s.status}</p>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Fee status */}
          {feeRecords.length > 0 && (
            <Card title="Fee Status">
              <div className="space-y-2">
                {feeRecords.map(r => (
                  <div key={r.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{r.feeStructure?.name}</p>
                      <p className="text-xs text-gray-500">Due: {formatDate(r.dueDate)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">₱{Number(r.amount).toLocaleString()}</p>
                      <Badge color={FEE_COLOR[r.status] || 'gray'}>{r.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Leave requests */}
          {leaveRequests.length > 0 && (
            <Card title="Leave Requests">
              <div className="space-y-2">
                {leaveRequests.map(l => (
                  <div key={l.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{formatDate(l.startDate)} → {formatDate(l.endDate)}</p>
                      <p className="text-xs text-gray-500 truncate max-w-[200px]">{l.reason}</p>
                    </div>
                    <Badge color={LEAVE_COLOR[l.status] || 'gray'}>{l.status}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Quick links */}
          <div className="flex flex-wrap gap-3">
            <Link to={`/parent/child/${selectedChild?.id}/performance`} className="btn-secondary text-sm">Full Performance →</Link>
            <Link to={`/parent/child/${selectedChild?.id}/attendance`} className="btn-secondary text-sm">Attendance Calendar →</Link>
            <Link to="/parent/leave/new" className="btn-secondary text-sm">Request Leave →</Link>
            <Link to="/parent/messages" className="btn-secondary text-sm">Message Teacher →</Link>
          </div>
        </>
      )}
    </div>
  );
};

export default ParentDashboard;
