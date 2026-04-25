import { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import BloomRadarChart from '../../components/charts/BloomRadarChart';
import { BLOOM_LEVELS, BLOOM_COLORS, BLOOM_LABELS } from '../../utils/constants';
import { formatDate } from '../../utils/helpers';

const ParentReports = () => {
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [dashData, setDashData] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);

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
      api.get(`/performance/child/${selectedChild.id}`),
      api.get(`/attendance?childId=${selectedChild.id}&limit=30`).catch(() => ({ data: { data: [] } })),
    ]).then(([perf, att]) => {
      setDashData(perf.data.data);
      setAttendance(att.data.data);
    }).finally(() => setLoading(false));
  }, [selectedChild?.id]);

  const handlePrint = () => {
    setPrinting(true);
    setTimeout(() => {
      window.print();
      setPrinting(false);
    }, 300);
  };

  const attendanceSummary = attendance.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  const totalDays = attendance.length;
  const presentDays = (attendanceSummary.PRESENT || 0) + (attendanceSummary.LATE || 0);
  const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header – hidden when printing */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Progress Report</h1>
          <p className="text-sm text-gray-500 mt-0.5">Generate and print your child's performance report</p>
        </div>
        <div className="flex items-center gap-3">
          {children.length > 1 && (
            <div className="flex gap-2">
              {children.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedChild(c)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedChild?.id === c.id ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  {c.firstName}
                </button>
              ))}
            </div>
          )}
          <Button onClick={handlePrint} loading={printing}>🖨️ Print Report</Button>
        </div>
      </div>

      {loading ? <LoadingSpinner className="mt-16" /> : dashData && (
        <div id="print-report" className="space-y-6">

          {/* Report Header (visible in print) */}
          <div className="p-6 bg-gradient-to-r from-primary-600 to-blue-600 text-white rounded-2xl print:rounded-none print:bg-white print:text-gray-900 print:border-b-4 print:border-primary-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-80 print:text-gray-500">SMART ECCD v2.0 — Progress Report</p>
                <h2 className="text-2xl font-bold mt-1">{selectedChild?.firstName} {selectedChild?.lastName}</h2>
                <p className="text-sm opacity-80 print:text-gray-500 mt-1">
                  Student ID: {selectedChild?.studentId} · Class: {dashData.child?.class?.name || '—'} · Teacher: {dashData.child?.class?.teacher?.name || '—'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm opacity-80 print:text-gray-500">Report Date</p>
                <p className="text-lg font-bold">{new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
          </div>

          {/* Bloom Profile */}
          <Card title="Bloom's Taxonomy Performance Profile">
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-4">
              {BLOOM_LEVELS.map(level => {
                const score = dashData.bloomProfile?.[level] ?? 0;
                const color = BLOOM_COLORS[level];
                return (
                  <div key={level} className="text-center">
                    <div className="relative w-16 h-16 mx-auto mb-2">
                      <svg viewBox="0 0 56 56" className="w-16 h-16">
                        <circle cx="28" cy="28" r="22" fill="none" stroke="#f3f4f6" strokeWidth="5" />
                        <circle cx="28" cy="28" r="22" fill="none"
                          stroke={color} strokeWidth="5"
                          strokeDasharray={`${(score / 100) * 2 * Math.PI * 22} ${2 * Math.PI * 22}`}
                          strokeLinecap="round"
                          transform="rotate(-90 28 28)"
                        />
                        <text x="28" y="33" textAnchor="middle" fontSize="11" fontWeight="700" fill={color}>{score}%</text>
                      </svg>
                    </div>
                    <p className="text-xs font-medium text-gray-700">{BLOOM_LABELS[level]}</p>
                  </div>
                );
              })}
            </div>
            <div className="print:hidden">
              <BloomRadarChart profile={dashData.bloomProfile || {}} height={220} />
            </div>
            <p className="text-xs text-gray-400 text-center mt-2">Each score reflects demonstrated competency across recorded activities (0–100%)</p>
          </Card>

          {/* Attendance Summary */}
          <Card title="Attendance Summary (Last 30 Records)">
            <div className="grid grid-cols-4 gap-4 mb-3">
              {[
                { label: 'Present',  count: attendanceSummary.PRESENT  || 0, color: 'text-green-600' },
                { label: 'Absent',   count: attendanceSummary.ABSENT   || 0, color: 'text-red-600'   },
                { label: 'Late',     count: attendanceSummary.LATE     || 0, color: 'text-yellow-600'},
                { label: 'Excused',  count: attendanceSummary.EXCUSED  || 0, color: 'text-blue-600'  },
              ].map(s => (
                <div key={s.label} className="text-center p-3 bg-gray-50 rounded-xl">
                  <p className={`text-3xl font-bold ${s.color}`}>{s.count}</p>
                  <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
              <div className="flex-1 bg-gray-200 rounded-full h-3">
                <div className="h-3 rounded-full bg-blue-500 transition-all" style={{ width: `${attendanceRate}%` }} />
              </div>
              <span className="text-sm font-bold text-blue-700">{attendanceRate}% attendance rate</span>
            </div>
          </Card>

          {/* Recent Activities */}
          {dashData.recentActivities?.length > 0 && (
            <Card title="Recent Activities">
              <div className="space-y-2">
                {dashData.recentActivities.slice(0, 8).map(a => (
                  <div key={a.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{a.activity?.title}</p>
                      <p className="text-xs text-gray-500">{formatDate(a.conductedDate || a.scheduledDate)}</p>
                    </div>
                    <div className="flex gap-1 flex-wrap justify-end max-w-[200px]">
                      {a.activity?.bloomLevels?.map(l => (
                        <span key={l} className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: BLOOM_COLORS[l] + '20', color: BLOOM_COLORS[l] }}>
                          {BLOOM_LABELS[l]}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Footer */}
          <div className="text-center text-xs text-gray-400 pt-4 border-t border-gray-100">
            <p>Generated by SMART ECCD v2.0 · {new Date().toLocaleString()}</p>
            <p className="mt-1">This report is computer-generated and reflects recorded data only.</p>
          </div>
        </div>
      )}

      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-report, #print-report * { visibility: visible; }
          #print-report { position: absolute; left: 0; top: 0; width: 100%; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default ParentReports;
