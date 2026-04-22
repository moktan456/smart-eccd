import { useState, useEffect } from 'react';
import api from '../../services/api';
import { performanceService } from '../../services/performance.service';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import BloomRadarChart from '../../components/charts/BloomRadarChart';
import { formatDate } from '../../utils/helpers';

const TeacherChildren = () => {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [bloomProfile, setBloomProfile] = useState(null);

  useEffect(() => {
    api.get('/children').then(({ data }) => setChildren(data.data)).finally(() => setLoading(false));
  }, []);

  const viewChild = async (child) => {
    setSelected(child);
    const { data } = await performanceService.getChildBloomProfile(child.id);
    setBloomProfile(data.data);
  };

  const columns = [
    { key: 'name', label: 'Name', render: r => `${r.firstName} ${r.lastName}` },
    { key: 'dateOfBirth', label: 'DOB', render: r => formatDate(r.dateOfBirth) },
    { key: 'actions', label: '', render: r => <button className="text-primary-600 text-sm hover:underline" onClick={() => viewChild(r)}>View Profile</button> },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Children</h1>
      <Card><Table columns={columns} data={children} loading={loading} /></Card>
      <Modal isOpen={!!selected} onClose={() => { setSelected(null); setBloomProfile(null); }} title={selected ? `${selected.firstName} ${selected.lastName}` : ''} size="lg">
        {bloomProfile && <BloomRadarChart profile={bloomProfile} height={280} />}
      </Modal>
    </div>
  );
};
export default TeacherChildren;
