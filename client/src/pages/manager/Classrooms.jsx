import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';

const EMPTY_FORM = { name: '', capacity: '', floor: '' };

const MgrClassrooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editRoom, setEditRoom] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    api.get('/classrooms').then(({ data }) => setRooms(data.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditRoom(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowModal(true);
  };

  const openEdit = (room) => {
    setEditRoom(room);
    setForm({ name: room.name, capacity: room.capacity || '', floor: room.floor || '' });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { name: form.name };
      if (form.capacity) payload.capacity = parseInt(form.capacity);
      if (form.floor)    payload.floor    = form.floor;

      if (editRoom) {
        await api.put(`/classrooms/${editRoom.id}`, payload);
      } else {
        await api.post('/classrooms', payload);
      }
      setShowModal(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save classroom.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (room) => {
    await api.delete(`/classrooms/${room.id}`);
    setConfirmDelete(null);
    load();
  };

  const columns = [
    {
      key: 'name', label: 'Room Name',
      render: r => (
        <div>
          <p className="font-medium text-sm">{r.name}</p>
          {r.floor && <p className="text-xs text-gray-400">{r.floor}</p>}
        </div>
      ),
    },
    {
      key: 'capacity', label: 'Capacity',
      render: r => r.capacity ? `${r.capacity} students` : <span className="text-gray-400">—</span>,
    },
    {
      key: 'classes', label: 'Assigned Classes',
      render: r => r.classes?.length
        ? <div className="flex flex-wrap gap-1">{r.classes.map(c => <Badge key={c.id} color="blue">{c.name}</Badge>)}</div>
        : <span className="text-gray-400 text-sm">None</span>,
    },
    {
      key: 'actions', label: '',
      render: r => (
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="secondary" onClick={() => openEdit(r)}>Edit</Button>
          <Button size="sm" variant="danger" onClick={() => setConfirmDelete(r)}>Archive</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Classrooms</h1>
        <Button onClick={openCreate}>+ New Classroom</Button>
      </div>

      <Card>
        <Table columns={columns} data={rooms} loading={loading} emptyMessage="No classrooms yet." />
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editRoom ? `Edit ${editRoom.name}` : 'Create Classroom'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" form="room-form" loading={saving}>{editRoom ? 'Save' : 'Create'}</Button>
          </>
        }
      >
        <form id="room-form" onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
          <Input label="Room Name" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Room A, Lab 1" required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Capacity (optional)" type="number" value={form.capacity} onChange={e => setForm(f=>({...f,capacity:e.target.value}))} min={1} />
            <Input label="Floor / Location"    value={form.floor}    onChange={e => setForm(f=>({...f,floor:e.target.value}))}    placeholder="Ground Floor" />
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Archive Classroom"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => handleDelete(confirmDelete)}>Archive</Button>
          </>
        }
      >
        <p className="text-sm text-gray-700">Archive <strong>{confirmDelete?.name}</strong>? Classes will be unlinked but all records are preserved.</p>
      </Modal>
    </div>
  );
};

export default MgrClassrooms;
