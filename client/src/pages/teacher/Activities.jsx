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
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    activityService.getMyAssignments().then(({ data }) => setAssignments(data.data)).finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: 'activity', label: 'Activity', render: r => r.activity?.title },
    { key: 'class', label: 'Class', render: r => r.class?.name },
    { key: 'scheduledDate', label: 'Date', render: r => formatDate(r.scheduledDate) },
    { key: 'bloomLevels', label: "Bloom's", render: r => <div className="flex flex-wrap gap-1">{r.activity?.bloomLevels?.map(l => <BloomBadge key={l} level={l} />)}</div> },
    { key: 'status', label: 'Status', render: r => <Badge color={statusColor[r.status]}>{r.status}</Badge> },
    { key: 'actions', label: '', render: r => r.status \!== 'COMPLETED' && <Link to={`/teacher/activities/${r.id}/conduct`}><Button size="sm">Conduct</Button></Link> },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Activities</h1>
      <Card><Table columns={columns} data={assignments} loading={loading} /></Card>
    </div>
  );
};
export default TeacherActivities;
