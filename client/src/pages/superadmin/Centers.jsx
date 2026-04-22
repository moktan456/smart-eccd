import { useState, useEffect } from 'react';
import { centerService } from '../../services/center.service';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';

const SaCenters = () => {
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', address: '', managerId: '' });

  const load = () => {
    setLoading(true);
    centerService.list().then(({ data }) => setCenters(data.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    await centerService.create(form);
    setShowModal(false);
    load();
  };

  const columns = [
    { key: 'name', label: 'Center Name' },
    { key: 'address', label: 'Address' },
    { key: 'manager', label: 'Manager', render: (r) => r.manager?.name || '—' },
    { key: '_count', label: 'Stats', render: (r) => `${r._count?.children ?? 0} children · ${r._count?.classes ?? 0} classes` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Centers</h1>
        <Button onClick={() => setShowModal(true)}>+ New Center</Button>
      </div>
      <Card>
        <Table columns={columns} data={centers} loading={loading} emptyMessage="No centers found." />
      </Card>
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Center"
        footer={<><Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button type="submit" form="center-form">Create</Button></>}>
        <form id="center-form" onSubmit={handleCreate} className="space-y-4">
          <Input label="Center Name" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} required />
          <Input label="Address" value={form.address} onChange={e => setForm(f=>({...f,address:e.target.value}))} required />
          <Input label="Manager User ID" value={form.managerId} onChange={e => setForm(f=>({...f,managerId:e.target.value}))} required placeholder="Enter existing manager's user ID" />
        </form>
      </Modal>
    </div>
  );
};
export default SaCenters;
