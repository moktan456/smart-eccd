import { useState, useEffect, useCallback } from 'react';
import { userService } from '../../services/user.service';
import { centerService } from '../../services/center.service';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { ROLE_LABELS } from '../../utils/constants';

const ROLE_FILTER_OPTIONS = [
  { value: '', label: 'All Roles' },
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'CENTER_MANAGER', label: 'Center Manager' },
  { value: 'TEACHER', label: 'Teacher' },
  { value: 'PARENT', label: 'Parent' },
];

const ROLE_CREATE_OPTIONS = [
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'CENTER_MANAGER', label: 'Center Manager' },
  { value: 'TEACHER', label: 'Teacher' },
  { value: 'PARENT', label: 'Parent' },
];

const roleColor = {
  SUPER_ADMIN: 'purple',
  CENTER_MANAGER: 'blue',
  TEACHER: 'green',
  PARENT: 'gray',
};

const EMPTY_FORM = { name: '', email: '', password: '', role: 'TEACHER', centerId: '' };

const SaUsers = () => {
  const [users, setUsers] = useState([]);
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    const params = { limit: 100 };
    if (roleFilter) params.role = roleFilter;
    if (search) params.search = search;
    userService.list(params)
      .then(({ data }) => setUsers(data.data))
      .finally(() => setLoading(false));
  }, [roleFilter, search]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    centerService.list({ limit: 100 }).then(({ data }) => setCenters(data.data));
  }, []);

  const centerOptions = [
    { value: '', label: '— No Center —' },
    ...centers.map(c => ({ value: c.id, label: c.name })),
  ];

  const openCreate = () => {
    setEditUser(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowModal(true);
  };

  const openEdit = (user) => {
    setEditUser(user);
    setForm({ name: user.name, email: user.email, password: '', role: user.role, centerId: user.centerId || '' });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editUser) {
        const updates = { name: form.name };
        if (form.password) updates.password = form.password;
        await userService.update(editUser.id, updates);
      } else {
        if (!form.password) { setError('Password is required.'); setSaving(false); return; }
        await userService.create({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
          centerId: form.centerId || undefined,
        });
      }
      setShowModal(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save user.');
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (user) => {
    await userService.toggleActivation(user.id);
    setUsers(u => u.map(x => x.id === user.id ? { ...x, isActive: !x.isActive } : x));
  };

  const needsCenter = ['CENTER_MANAGER', 'TEACHER', 'PARENT'].includes(form.role);

  const columns = [
    {
      key: 'name', label: 'Name',
      render: r => (
        <div>
          <p className="font-medium text-sm text-gray-900">{r.name}</p>
          <p className="text-xs text-gray-500">{r.email}</p>
        </div>
      ),
    },
    { key: 'role', label: 'Role', render: r => <Badge color={roleColor[r.role]}>{ROLE_LABELS[r.role]}</Badge> },
    { key: 'isActive', label: 'Status', render: r => <Badge color={r.isActive ? 'green' : 'gray'}>{r.isActive ? 'Active' : 'Inactive'}</Badge> },
    {
      key: 'actions', label: '',
      render: r => (
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="secondary" onClick={() => openEdit(r)}>Edit</Button>
          <Button size="sm" variant={r.isActive ? 'danger' : 'secondary'} onClick={() => toggle(r)}>
            {r.isActive ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <Button onClick={openCreate}>+ New User</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Search by name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="sm:w-64"
        />
        <Select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          options={ROLE_FILTER_OPTIONS}
          className="sm:w-48"
        />
      </div>

      <Card>
        <Table columns={columns} data={users} loading={loading} emptyMessage="No users found." />
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editUser ? `Edit User – ${editUser.name}` : 'Create New User'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" form="user-form" loading={saving}>
              {editUser ? 'Save Changes' : 'Create User'}
            </Button>
          </>
        }
      >
        <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
          <Input
            label="Full Name"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            required
          />
          {!editUser && (
            <>
              <Input
                label="Email Address"
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
              <Select
                label="Role"
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value, centerId: '' }))}
                options={ROLE_CREATE_OPTIONS}
                required
              />
              {needsCenter && (
                <Select
                  label="Assign to Center"
                  value={form.centerId}
                  onChange={e => setForm(f => ({ ...f, centerId: e.target.value }))}
                  options={centerOptions}
                />
              )}
            </>
          )}
          <Input
            label={editUser ? 'New Password (leave blank to keep)' : 'Password'}
            type="password"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            placeholder={editUser ? 'Leave blank to keep current' : ''}
            minLength={8}
            required={!editUser}
          />
        </form>
      </Modal>
    </div>
  );
};

export default SaUsers;
