import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { activityService } from '../../services/activity.service';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Badge, { BloomBadge } from '../../components/common/Badge';
import { formatDate } from '../../utils/helpers';

const statusColor = { PENDING: 'yellow', IN_PROGRESS: 'blue', COMPLETED: 'green', SKIPPED: 'gray' };

const TeacherActivities = () => {
  const [library, setLibrary]         = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loadingLib, setLoadingLib]   = useState(true);
  const [loadingAssign, setLoadingAssign] = useState(true);
  const [tab, setTab] = useState('library');

  useEffect(() => {
    activityService.list({ status: 'PUBLISHED' })
      .then(({ data }) => setLibrary(data.data || []))
      .finally(() => setLoadingLib(false));

    activityService.getMyAssignments()
      .then(({ data }) => setAssignments(data.data || []))
      .finally(() => setLoadingAssign(false));
  }, []);

  const handleArchive = async (id) => {
    await activityService.archive(id);
    setLibrary(a => a.filter(x => x.id !== id));
  };

  const libraryColumns = [
    { key: 'title', label: 'Title', render: r => <span className="font-medium text-sm">{r.title}</span> },
    { key: 'activityType', label: 'Type' },
    { key: 'bloomLevels', label: "Bloom's Levels", render: r => <div className="flex flex-wrap gap-1">{r.bloomLevels?.map(l => <BloomBadge key={l} level={l} />)}</div> },
    { key: 'ageGroup', label: 'Age Group' },
    { key: 'actions', label: '', render: r => (
      <div className="flex gap-2 justify-end">
        <Link to={`/teacher/activities/${r.id}/assign`}>
          <Button size="sm" variant="secondary">Assign</Button>
        </Link>
        <Button size="sm" variant="danger" onClick={() => handleArchive(r.id)}>Archive</Button>
      </div>
    )},
  ];

  const assignmentColumns = [
    { key: 'activity', label: 'Activity', render: r => <span className="font-medium text-sm">{r.activity?.title}</span> },
    { key: 'class', label: 'Class', render: r => r.class?.name },
    { key: 'scheduledDate', label: 'Date', render: r => formatDate(r.scheduledDate) },
    { key: 'bloomLevels', label: "Bloom's", render: r => <div className="flex flex-wrap gap-1">{r.activity?.bloomLevels?.map(l => <BloomBadge key={l} level={l} />)}</div> },
    { key: 'status', label: 'Status', render: r => <Badge color={statusColor[r.status]}>{r.status}</Badge> },
    { key: 'actions', label: '', render: r => r.status !== 'COMPLETED' && (
      <Link to={`/teacher/activities/${r.id}/conduct`}>
        <Button size="sm">Conduct</Button>
      </Link>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Activities</h1>
        <Link to="/teacher/activities/new">
          <Button>+ New Activity</Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
        <button
          onClick={() => setTab('library')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'library' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-800'}`}
        >
          Activity Library
        </button>
        <button
          onClick={() => setTab('assignments')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'assignments' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-800'}`}
        >
          My Schedule
        </button>
      </div>

      {tab === 'library' && (
        <Card>
          <Table columns={libraryColumns} data={library} loading={loadingLib} emptyMessage="No published activities yet. Create one to get started." />
        </Card>
      )}

      {tab === 'assignments' && (
        <Card>
          <Table columns={assignmentColumns} data={assignments} loading={loadingAssign} emptyMessage="No scheduled activities. Assign an activity from the library." />
        </Card>
      )}
    </div>
  );
};

export default TeacherActivities;
