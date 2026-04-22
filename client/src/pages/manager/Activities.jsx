import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { activityService } from '../../services/activity.service';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import { BloomBadge } from '../../components/common/Badge';

const MgrActivities = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    activityService.list({ status: 'PUBLISHED' }).then(({ data }) => setActivities(data.data)).finally(() => setLoading(false));
  }, []);

  const handleArchive = async (id) => {
    await activityService.archive(id);
    setActivities(a => a.filter(x => x.id \!== id));
  };

  const columns = [
    { key: 'title', label: 'Title' },
    { key: 'activityType', label: 'Type' },
    { key: 'bloomLevels', label: "Bloom's Levels", render: r => <div className="flex flex-wrap gap-1">{r.bloomLevels?.map(l => <BloomBadge key={l} level={l} />)}</div> },
    { key: 'ageGroup', label: 'Age Group' },
    { key: 'actions', label: '', render: r => (
      <div className="flex gap-2">
        <Link to={`/manager/activities/${r.id}/assign`}><Button size="sm" variant="secondary">Assign</Button></Link>
        <Button size="sm" variant="danger" onClick={() => handleArchive(r.id)}>Archive</Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Activity Library</h1>
        <Link to="/manager/activities/new"><Button>+ New Activity</Button></Link>
      </div>
      <Card><Table columns={columns} data={activities} loading={loading} /></Card>
    </div>
  );
};
export default MgrActivities;
