import { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';

const MgrClasses = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', ageGroup: '', teacherId: '' });

  const load = () => {
    setLoading(true);
    api.get('/classes').then(({ data }) => setClasses(data.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    await api.post('/classes', form);
    setShowModal(false);
    load();
  };

  const columns = [
    { key: 'name', label: 'Class Name' },
    { key: 'ageGroup', label: 'Age Group' },
    { key: 'teacher', label: 'Teacher', render: r => r.teacher?.name || '—' },
    { key: '_count', label: 'Children', render: r => r._count?.children ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Classes</h1>
        <Button onClick={() => setShowModal(true)}>+ New Class</Button>
      </div>
      <Card><Table columns={columns} data={classes} loading={loading} /></Card>
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Class"
        footer={<><Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button type="submit" form="class-form">Create</Button></>}>
        <form id="class-form" onSubmit={handleCreate} className="space-y-4">
          <Input label="Class Name" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} required />
          <Input label="Age Group" value={form.ageGroup} onChange={e => setForm(f=>({...f,ageGroup:e.target.value}))} placeholder="e.g. 4-5 years" required />
          <Input label="Teacher ID" value={form.teacherId} onChange={e => setForm(f=>({...f,teacherId:e.target.value}))} required />
        </form>
      </Modal>
    </div>
  );
};
export default MgrClasses;
