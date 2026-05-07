import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';

const ROLE_OPTIONS = [
  { value: 'TEACHER', label: 'Teacher' },
  { value: 'PARENT',  label: 'Parent'  },
];

const ROLE_COLOR = { TEACHER: 'blue', PARENT: 'gray', CENTER_MANAGER: 'purple' };
const TABS = [
  { key: 'TEACHER', label: 'Teachers' },
  { key: 'PARENT',  label: 'Parents'  },
];

const EMPTY_FORM = { name: '', email: '', password: '', phone: '', role: 'TEACHER' };

const MgrStaff = () => {
  const [tab, setTab]           = useState('TEACHER');
  const [staff, setStaff]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editStaff, setEditStaff] = useState(null);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [search, setSearch]     = useState('');

  const load = useCallback(() => {
    setLoading(true);
    api.get('/users', { params: { role: tab, limit: 100, search: search || undefined } })
      .then(({ data }) => setStaff(data.data))
      .finally(() => setLoading(false));
  }, [tab, search]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditStaff(null);
    setForm({ ...EMPTY_FORM, role: tab });
    setError('');
    setShowModal(true);
  };

  const openEdit = (s) => {
    setEditStaff(s);
    setForm({ name: s.name, email: s.email, password: '', phone: s.phone || '', role: s.role });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { name: form.name, email: form.email, role: form.role };
      if (form.phone)    payload.phone    = form.phone;
      if (form.password) payload.password = form.password;

      if (editStaff) {
        await api.put(`/users/${editStaff.id}`, payload);
      } else {
        if (!form.password) { setError('Password is required.'); setSaving(false); return; }
        await api.post('/users', payload);
      }
      setShowModal(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save record.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (s) => {
    await api.delete(`/users/${s.id}`);
    setConfirmDelete(null);
    load();
  };

  const teacherColumns = [
    {
      key: 'name', label: 'Teacher',
      render: r => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm flex-shrink-0">
            {r.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-sm">{r.name}</p>
            <p className="text-xs text-gray-500">{r.email}</p>
            {r.phone && <p className="text-xs text-gray-400">{r.phone}</p>}
          </div>
        </div>
      ),
    },
    { key: 'role', label: 'Role', render: r => <Badge color={ROLE_COLOR[r.role] || 'gray'}>{r.role.replace('_', ' ')}</Badge> },
    {
      key: 'class', label: 'Assigned Class',
      render: r => r.teachingClass
        ? <span className="text-sm">{r.teachingClass.name}</span>
        : <span className="text-gray-400 text-sm">Not assigned</span>,
    },
    {
      key: 'actions', label: '',
      render: r => (
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="secondary" onClick={() => openEdit(r)}>Edit</Button>
          <Button size="sm" variant="danger" onClick={() => setConfirmDelete(r)}>Remove</Button>
        </div>
      ),
    },
  ];

  const parentColumns = [
    {
      key: 'name', label: 'Parent',
      render: r => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-sm flex-shrink-0">
            {r.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-sm">{r.name}</p>
            <p className="text-xs text-gray-500">{r.email}</p>
            {r.phone && <p className="text-xs text-gray-400">{r.phone}</p>}
          </div>
        </div>
      ),
    },
    { key: 'role', label: 'Role', render: () => <Badge color="gray">Parent</Badge> },
    { key: 'isActive', label: 'Status', render: r => <Badge color={r.isActive ? 'green' : 'gray'}>{r.isActive ? 'Active' : 'Inactive'}</Badge> },
    {
      key: 'actions', label: '',
      render: r => (
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="secondary" onClick={() => openEdit(r)}>Edit</Button>
          <Button size="sm" variant="danger" onClick={() => setConfirmDelete(r)}>Remove</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">People Management</h1>
        <Button onClick={openCreate}>+ Add {tab === 'TEACHER' ? 'Teacher' : 'Parent'}</Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setSearch(''); }}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === t.key ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-800'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Input
        placeholder={`Search ${tab === 'TEACHER' ? 'teachers' : 'parents'} by name or email…`}
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-72"
      />

      <Card>
        <Table
          columns={tab === 'TEACHER' ? teacherColumns : parentColumns}
          data={staff}
          loading={loading}
          emptyMessage={`No ${tab === 'TEACHER' ? 'teachers' : 'parents'} found.`}
        />
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editStaff ? `Edit – ${editStaff.name}` : `Add ${form.role === 'TEACHER' ? 'Teacher' : 'Parent'}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" form="staff-form" loading={saving}>{editStaff ? 'Save' : 'Add'}</Button>
          </>
        }
      >
        <form id="staff-form" onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
          {!editStaff && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <div className="flex gap-3">
                {ROLE_OPTIONS.map(opt => (
                  <label key={opt.value} className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 cursor-pointer transition-colors ${form.role === opt.value ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                    <input type="radio" name="role" value={opt.value} checked={form.role === opt.value} onChange={e => setForm(f=>({...f,role:e.target.value}))} className="sr-only" />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
          )}
          <Input label="Full Name" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} required />
          <Input label="Email Address" type="email" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} required />
          <Input label="Phone (optional)" value={form.phone} onChange={e => setForm(f=>({...f,phone:e.target.value}))} placeholder="+975 17 XXX XXX" />
          <Input
            label={editStaff ? 'New Password (leave blank to keep)' : 'Password'}
            type="password"
            value={form.password}
            onChange={e => setForm(f=>({...f,password:e.target.value}))}
            placeholder="Minimum 8 characters"
            required={!editStaff}
          />
        </form>
      </Modal>

      {/* Confirm Remove */}
      <Modal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Remove Account"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => handleDeactivate(confirmDelete)}>Remove</Button>
          </>
        }
      >
        <p className="text-sm text-gray-700">
          Remove <strong>{confirmDelete?.name}</strong> from this center? Their records are preserved but they will lose system access.
        </p>
      </Modal>
    </div>
  );
};

export default MgrStaff;
