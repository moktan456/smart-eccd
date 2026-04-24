import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { userService } from '../../services/user.service';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';

const EMPTY_FORM = { name: '', ageGroup: '', teacherId: '' };

const MgrClasses = () => {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editClass, setEditClass] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    api.get('/classes').then(({ data }) => setClasses(data.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    userService.list({ role: 'TEACHER', limit: 100 })
      .then(({ data }) => setTeachers(data.data));
  }, []);

  const teacherOptions = [
    { value: '', label: '— Select Teacher —' },
    ...teachers.map(t => ({ value: t.id, label: t.name })),
  ];

  const openCreate = () => {
    setEditClass(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowModal(true);
  };

  const openEdit = (cls) => {
    setEditClass(cls);
    setForm({ name: cls.name, ageGroup: cls.ageGroup, teacherId: cls.teacher?.id || '' });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editClass) {
        await api.put(`/classes/${editClass.id}`, form);
      } else {
        await api.post('/classes', form);
      }
      setShowModal(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save class.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (cls) => {
    await api.delete(`/classes/${cls.id}`);
    setConfirmDelete(null);
    load();
  };

  const columns = [
    {
      key: 'name', label: 'Class Name',
      render: r => <span className="font-medium text-sm">{r.name}</span>,
    },
    { key: 'ageGroup', label: 'Age Group' },
    {
      key: 'teacher', label: 'Teacher',
      render: r => r.teacher ? (
        <div>
          <p className="text-sm text-gray-900">{r.teacher.name}</p>
          <p className="text-xs text-gray-500">{r.teacher.email}</p>
        </div>
      ) : <span className="text-gray-400 text-sm">— Unassigned —</span>,
    },
    {
      key: '_count', label: 'Children',
      render: r => (
        <Badge color="blue">{r._count?.children ?? 0} enrolled</Badge>
      ),
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
        <h1 className="text-2xl font-bold text-gray-900">Classes</h1>
        <Button onClick={openCreate}>+ New Class</Button>
      </div>

      <Card>
        <Table columns={columns} data={classes} loading={loading} emptyMessage="No classes yet." />
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editClass ? `Edit Class – ${editClass.name}` : 'Create New Class'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" form="class-form" loading={saving}>
              {editClass ? 'Save Changes' : 'Create Class'}
            </Button>
          </>
        }
      >
        <form id="class-form" onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
          <Input
            label="Class Name"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            required
          />
          <Input
            label="Age Group"
            value={form.ageGroup}
            onChange={e => setForm(f => ({ ...f, ageGroup: e.target.value }))}
            placeholder="e.g. 4–5 years"
            required
          />
          <Select
            label="Assign Teacher"
            value={form.teacherId}
            onChange={e => setForm(f => ({ ...f, teacherId: e.target.value }))}
            options={teacherOptions}
            required
          />
          {teachers.length === 0 && (
            <p className="text-xs text-amber-600">No teachers found. Create teacher accounts first.</p>
          )}
        </form>
      </Modal>

      {/* Confirm Archive */}
      <Modal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Archive Class"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => handleDeactivate(confirmDelete)}>Archive</Button>
          </>
        }
      >
        <p className="text-sm text-gray-700">
          Archive <strong>{confirmDelete?.name}</strong>? Children in this class will keep their records but the class will be hidden.
        </p>
      </Modal>
    </div>
  );
};

export default MgrClasses;
