import { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import { formatDate } from '../../utils/helpers';

const MgrChildren = () => {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/children').then(({ data }) => setChildren(data.data)).finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: 'name', label: 'Name', render: r => `${r.firstName} ${r.lastName}` },
    { key: 'dateOfBirth', label: 'Date of Birth', render: r => formatDate(r.dateOfBirth) },
    { key: 'class', label: 'Class', render: r => r.class?.name || '—' },
    { key: 'parents', label: 'Parents', render: r => r.parents?.map(p => p.parent?.name).join(', ') || '—' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Children</h1>
      <Card><Table columns={columns} data={children} loading={loading} /></Card>
    </div>
  );
};
export default MgrChildren;
