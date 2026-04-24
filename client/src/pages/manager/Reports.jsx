import { useState, useEffect } from 'react';
import { reportService } from '../../services/report.service';
import api from '../../services/api';
import Card, { StatCard } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Badge, { BloomBadge } from '../../components/common/Badge';
import BloomBarChart from '../../components/charts/BloomBarChart';
import Modal from '../../components/common/Modal';
import BloomRadarChart from '../../components/charts/BloomRadarChart';
import { performanceService } from '../../services/performance.service';
import { formatDate } from '../../utils/helpers';

const MgrReports = () => {
  const [report, setReport] = useState(null);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState(null);
  const [childReport, setChildReport] = useState(null);
  const [childLoading, setChildLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      reportService.getCenterReport(),
      api.get('/children?limit=100'),
    ]).then(([rpt, kids]) => {
      setReport(rpt.data.data);
      setChildren(kids.data.data);
    }).finally(() => setLoading(false));
  }, []);

  const openChildReport = async (child) => {
    setSelectedChild(child);
    setChildReport(null);
    setChildLoading(true);
    try {
      const [rpt, bloom] = await Promise.all([
        reportService.getChildReport(child.id),
        performanceService.getChildBloomProfile(child.id),
      ]);
      setChildReport({ ...rpt.data.data, bloomProfile: bloom.data.data });
    } finally {
      setChildLoading(false);
    }
  };

  // Flagged children from center report
  const flaggedChildren = report?.flaggedChildren || [];

  // Class overview cards
  const classRows = report?.classes || [];

  const childColumns = [
    {
      key: 'name', label: 'Child',
      render: r => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold flex-shrink-0">
            {r.firstName.charAt(0)}
          </div>
          <span className="text-sm font-medium">{r.firstName} {r.lastName}</span>
        </div>
      ),
    },
    { key: 'class', label: 'Class', render: r => r.class?.name || '—' },
    {
      key: 'actions', label: '',
      render: r => (
        <Button size="sm" variant="secondary" onClick={() => openChildReport(r)}>
          View Report
        </Button>
      ),
    },
  ];

  const flagColumns = [
    {
      key: 'child', label: 'Child',
      render: r => `${r.child?.firstName} ${r.child?.lastName}`,
    },
    { key: 'class', label: 'Class', render: r => r.child?.class?.name || '—' },
    {
      key: 'flagReason', label: 'Reason',
      render: r => <span className="text-xs text-red-700 bg-red-50 px-2 py-0.5 rounded">{r.flagReason}</span>,
    },
    {
      key: 'bloom', label: 'Bloom Level',
      render: r => <BloomBadge level={r.bloomLevelAchieved} />,
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>

      {/* Center Bloom Coverage */}
      <Card title="Center-Wide Bloom's Coverage">
        {loading ? (
          <div className="h-40 flex items-center justify-center text-gray-400">Loading…</div>
        ) : (
          <BloomBarChart coverage={report?.bloomCoverage || {}} />
        )}
      </Card>

      {/* Class Overview */}
      {classRows.length > 0 && (
        <Card title="Classes Overview">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {classRows.map(cls => (
              <div key={cls.id} className="p-4 border border-gray-200 rounded-xl hover:border-primary-300 transition-colors">
                <p className="font-semibold text-gray-900">{cls.name}</p>
                <p className="text-xs text-gray-500 mb-2">Teacher: {cls.teacher?.name || '—'}</p>
                <div className="flex gap-3 text-sm">
                  <span className="text-gray-600">{cls._count?.children ?? 0} children</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Flagged Children */}
      {flaggedChildren.length > 0 && (
        <Card title={`Flagged Children – Needs Attention (${flaggedChildren.length})`}>
          <Table columns={flagColumns} data={flaggedChildren} emptyMessage="No flagged children." />
        </Card>
      )}

      {/* Per-Child Reports */}
      <Card title="Individual Child Reports">
        <Table columns={childColumns} data={children} loading={loading} emptyMessage="No children found." />
      </Card>

      {/* Child Report Modal */}
      <Modal
        isOpen={!!selectedChild}
        onClose={() => { setSelectedChild(null); setChildReport(null); }}
        title={selectedChild ? `Report – ${selectedChild.firstName} ${selectedChild.lastName}` : ''}
        size="lg"
        footer={<Button variant="secondary" onClick={() => { setSelectedChild(null); setChildReport(null); }}>Close</Button>}
      >
        {childLoading ? (
          <div className="py-12 text-center text-gray-400">Generating report…</div>
        ) : childReport ? (
          <div className="space-y-5">
            {/* Child info */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 text-xl font-bold">
                {childReport.child?.firstName?.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{childReport.child?.firstName} {childReport.child?.lastName}</p>
                <p className="text-sm text-gray-500">Class: {childReport.child?.class?.name || '—'} · Teacher: {childReport.child?.class?.teacher?.name || '—'}</p>
                <p className="text-xs text-gray-400">Born {formatDate(childReport.child?.dateOfBirth)}</p>
              </div>
            </div>

            {/* Bloom radar */}
            {childReport.bloomProfile && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Bloom's Taxonomy Profile</p>
                <BloomRadarChart profile={childReport.bloomProfile} height={220} />
              </div>
            )}

            {/* Attendance summary */}
            {Object.keys(childReport.attendanceSummary || {}).length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Attendance Summary (All Time)</p>
                <div className="grid grid-cols-4 gap-3">
                  {Object.entries(childReport.attendanceSummary).map(([status, count]) => {
                    const colors = { PRESENT: 'green', ABSENT: 'red', LATE: 'yellow', EXCUSED: 'blue' };
                    return (
                      <div key={status} className="text-center">
                        <p className="text-xl font-bold text-gray-900">{count}</p>
                        <Badge color={colors[status] || 'gray'}>{status}</Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recent performances */}
            {childReport.performances?.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Recent Activity Records</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {childReport.performances.slice(0, 10).map(p => (
                    <div key={p.id} className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="text-sm font-medium">{p.record?.assignment?.activity?.title}</p>
                        <p className="text-xs text-gray-500">{formatDate(p.createdAt)} · {p.completionStatus}</p>
                      </div>
                      <BloomBadge level={p.bloomLevelAchieved} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-gray-400 text-right">Generated {new Date().toLocaleDateString()}</p>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default MgrReports;
