import { useState, useEffect } from 'react';
import api from '../../services/api';
import { performanceService } from '../../services/performance.service';
import { attendanceService } from '../../services/attendance.service';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Badge, { BloomBadge } from '../../components/common/Badge';
import BloomRadarChart from '../../components/charts/BloomRadarChart';
import { formatDate } from '../../utils/helpers';

const ATTENDANCE_COLORS = {
  PRESENT: 'green',
  ABSENT: 'red',
  LATE: 'yellow',
  EXCUSED: 'blue',
};

const TeacherChildren = () => {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [profile, setProfile] = useState(null);
  const [performances, setPerformances] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('bloom');

  useEffect(() => {
    api.get('/children').then(({ data }) => setChildren(data.data)).finally(() => setLoading(false));
  }, []);

  const filtered = search
    ? children.filter(c =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase())
      )
    : children;

  const viewChild = async (child) => {
    setSelected(child);
    setProfile(null);
    setPerformances([]);
    setAttendanceSummary(null);
    setActiveTab('bloom');
    setDetailLoading(true);
    try {
      const now = new Date();
      const [p, perf, att] = await Promise.all([
        performanceService.getChildBloomProfile(child.id),
        performanceService.getChildPerformance(child.id, { limit: 10 }),
        attendanceService.getAttendanceSummary(child.id, { year: now.getFullYear(), month: now.getMonth() + 1 }),
      ]);
      setProfile(p.data.data);
      setPerformances(perf.data.data);
      setAttendanceSummary(att.data.data);
    } finally {
      setDetailLoading(false);
    }
  };

  const ageInMonths = (dob) => {
    const diff = new Date() - new Date(dob);
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 30.44));
  };

  const columns = [
    {
      key: 'name', label: 'Child',
      render: r => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm flex-shrink-0">
            {r.firstName.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-sm text-gray-900">{r.firstName} {r.lastName}</p>
            <p className="text-xs text-gray-500">Age: {Math.floor(ageInMonths(r.dateOfBirth) / 12)}y {ageInMonths(r.dateOfBirth) % 12}m</p>
          </div>
        </div>
      ),
    },
    { key: 'dateOfBirth', label: 'Date of Birth', render: r => formatDate(r.dateOfBirth) },
    {
      key: 'parents', label: 'Parent',
      render: r => r.parents?.[0]?.parent?.name || <span className="text-gray-400 text-sm">—</span>,
    },
    {
      key: 'actions', label: '',
      render: r => (
        <Button size="sm" variant="secondary" onClick={() => viewChild(r)}>View Profile</Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Children</h1>

      <input
        type="text"
        placeholder="Search children…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="form-input w-full sm:w-64"
      />

      <Card>
        <Table columns={columns} data={filtered} loading={loading} emptyMessage="No children in your class." />
      </Card>

      {/* Child Profile Modal */}
      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `${selected.firstName} ${selected.lastName}` : ''}
        size="lg"
        footer={<Button variant="secondary" onClick={() => setSelected(null)}>Close</Button>}
      >
        {detailLoading ? (
          <div className="py-12 text-center text-gray-400">Loading profile…</div>
        ) : selected && (
          <div className="space-y-4">
            {/* Child header */}
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
              <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 text-xl font-bold">
                {selected.firstName.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{selected.firstName} {selected.lastName}</p>
                <p className="text-sm text-gray-500">Born: {formatDate(selected.dateOfBirth)}</p>
                <p className="text-xs text-gray-400">
                  Parent: {selected.parents?.[0]?.parent?.name || '—'}
                </p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-gray-200">
              {['bloom', 'activities', 'attendance'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${activeTab === tab ? 'border-primary-500 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                  {tab === 'bloom' ? "Bloom's Profile" : tab === 'activities' ? 'Recent Activities' : 'Attendance'}
                </button>
              ))}
            </div>

            {/* Bloom Tab */}
            {activeTab === 'bloom' && (
              <div>
                {profile ? (
                  <BloomRadarChart profile={profile} height={260} />
                ) : (
                  <p className="text-gray-400 text-sm text-center py-8">No performance data yet.</p>
                )}
              </div>
            )}

            {/* Activities Tab */}
            {activeTab === 'activities' && (
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {performances.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-8">No activity records yet.</p>
                ) : performances.map(p => (
                  <div key={p.id} className="flex justify-between items-start py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{p.record?.assignment?.activity?.title}</p>
                      <p className="text-xs text-gray-500">{formatDate(p.createdAt)} · {p.completionStatus}</p>
                      {p.observationNotes && (
                        <p className="text-xs text-gray-600 italic mt-0.5">"{p.observationNotes}"</p>
                      )}
                    </div>
                    <BloomBadge level={p.bloomLevelAchieved} />
                  </div>
                ))}
              </div>
            )}

            {/* Attendance Tab */}
            {activeTab === 'attendance' && attendanceSummary && (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-3">
                  {Object.entries(attendanceSummary.counts || {}).map(([status, count]) => (
                    <div key={status} className="text-center">
                      <p className="text-xl font-bold text-gray-900">{count}</p>
                      <Badge color={ATTENDANCE_COLORS[status] || 'gray'}>{status}</Badge>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 text-center">This month's attendance</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TeacherChildren;
