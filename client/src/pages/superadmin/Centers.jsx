import { useState, useEffect, useCallback } from 'react';
import { centerService } from '../../services/center.service';
import { userService } from '../../services/user.service';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';

const EMPTY_FORM = { name: '', address: '', phone: '', email: '', managerId: '' };

const SaCenters = () => {
  const [centers, setCenters] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editCenter, setEditCenter] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    centerService.list({ limit: 100, search: search || undefined })
      .then(({ data }) => setCenters(data.data))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    userService.list({ role: 'CENTER_MANAGER', limit: 100 })
      .then(({ data }) => setManagers(data.data));
  }, []);

  const managerOptions = [
    { value: '', label: '— Select Manager —' },
    ...managers.map(m => ({ value: m.id, label: `${m.name} (${m.email})` })),
  ];

  const openCreate = () => {
    setEditCenter(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowModal(true);
  };

  const openEdit = (center) => {
    setEditCenter(center);
    setForm({
      name: center.name,
      address: center.address || '',
      phone: center.phone || '',
      email: center.email || '',
      managerId: center.manager?.id || '',
    });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { ...form };
      if (!payload.phone) delete payload.phone;
      if (!payload.email) delete payload.email;
      if (!payload.managerId) delete payload.managerId;

      if (editCenter) {
        await centerService.update(editCenter.id, payload);
      } else {
        await centerService.create(payload);
      }
      setShowModal(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save center.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (center) => {
    await centerService.delete(center.id);
    setConfirmDelete(null);
    load();
  };

  const columns = [
    {
      key: 'name', label: 'Center',
      render: r => (
        <div>
          <p className="font-medium text-sm text-gray-900">{r.name}</p>
          <p className="text-xs text-gray-500">{r.address}</p>
        </div>
      ),
    },
    { key: 'manager', label: 'Manager', render: r => r.manager?.name || <span className="text-gray-400 text-sm">— Unassigned —</span> },
    {
      key: '_count', label: 'Stats',
      render: r => (
        <div className="flex gap-3 text-xs text-gray-600">
          <span>{r._count?.children ?? 0} children</span>
          <span>{r._count?.classes ?? 0} classes</span>
        </div>
      ),
    },
    {
      key: 'isActive', label: 'Status',
      render: r => <Badge color={r.isActive !== false ? 'green' : 'gray'}>{r.isActive !== false ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      key: 'actions', label: '',
      render: r => (
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="secondary" onClick={() => openEdit(r)}>Edit</Button>
          <Button size="sm" variant="danger" onClick={() => setConfirmDelete(r)}>Deactivate</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <h1 className="text-2xl font-bold text-gray-900">Centers</h1>
        <Button onClick={openCreate}>+ New Center</Button>
      </div>

      <Input
        placeholder="Search centers…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="sm:w-64"
      />

      <Card>
        <Table columns={columns} data={centers} loading={loading} emptyMessage="No centers found." />
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editCenter ? `Edit Center – ${editCenter.name}` : 'Create New Center'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" form="center-form" loading={saving}>
              {editCenter ? 'Save Changes' : 'Create Center'}
            </Button>
          </>
        }
      >
        <form id="center-form" onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
          <Input
            label="Center Name"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            required
          />
          <Input
            label="Address"
            value={form.address}
            onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Phone (optional)"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="+63 912 345 6789"
            />
            <Input
              label="Email (optional)"
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            />
          </div>
          <Select
            label="Center Manager"
            value={form.managerId}
            onChange={e => setForm(f => ({ ...f, managerId: e.target.value }))}
            options={managerOptions}
          />
          {managers.length === 0 && (
            <p className="text-xs text-amber-600">No Center Manager accounts yet. Create one in Users first.</p>
          )}
        </form>
      </Modal>

      {/* Confirm Deactivate */}
      <Modal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Deactivate Center"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => handleDeactivate(confirmDelete)}>Deactivate</Button>
          </>
        }
      >
        <p className="text-sm text-gray-700">
          Are you sure you want to deactivate <strong>{confirmDelete?.name}</strong>?
          This will hide the center but preserve all records.
        </p>
      </Modal>
    </div>
  );
};

export default SaCenters;
