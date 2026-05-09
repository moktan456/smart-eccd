import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';

const EMPTY_FORM = { name: '', email: '', password: '', phone: '' };

const MgrParents = () => {
  const [parents, setParents]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [editParent, setEditParent] = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [search, setSearch]         = useState('');

  // Link Children modal state
  const [linkParent, setLinkParent]     = useState(null);
  const [allChildren, setAllChildren]   = useState([]);
  const [checkedIds, setCheckedIds]     = useState([]);
  const [linkSaving, setLinkSaving]     = useState(false);
  const [linkError, setLinkError]       = useState('');

  const load = useCallback(() => {
    setLoading(true);
    api.get('/users', { params: { role: 'PARENT', limit: 100, search: search || undefined } })
      .then(({ data }) => setParents(data.data))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { load(); }, [load]);

  // ── Create / Edit ──────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditParent(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditParent(p);
    setForm({ name: p.name, email: p.email, password: '', phone: p.phone || '' });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { name: form.name, email: form.email, role: 'PARENT' };
      if (form.phone)    payload.phone    = form.phone;
      if (form.password) payload.password = form.password;

      if (editParent) {
        await api.put(`/users/${editParent.id}`, payload);
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

  // ── Remove ─────────────────────────────────────────────────────────────────

  const handleRemove = async (p) => {
    try {
      await api.delete(`/users/${p.id}`);
      setConfirmDelete(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove account.');
      setConfirmDelete(null);
    }
  };

  // ── Link Children ──────────────────────────────────────────────────────────

  const openLink = async (p) => {
    setLinkParent(p);
    setLinkError('');
    setLinkSaving(false);
    try {
      const { data } = await api.get('/children?limit=100');
      const children = data.data;
      setAllChildren(children);
      // Pre-check children already linked to this parent
      const preChecked = children
        .filter(c => c.parents?.some(pr => pr.parent.id === p.id))
        .map(c => c.id);
      setCheckedIds(preChecked);
    } catch {
      setAllChildren([]);
      setCheckedIds([]);
    }
  };

  const toggleChild = (childId) => {
    setCheckedIds(prev =>
      prev.includes(childId)
        ? prev.filter(id => id !== childId)
        : [...prev, childId]
    );
  };

  const handleLinkSave = async () => {
    if (!linkParent) return;
    setLinkSaving(true);
    setLinkError('');
    try {
      const originalLinkedChildIds = allChildren
        .filter(c => c.parents?.some(p => p.parent.id === linkParent.id))
        .map(c => c.id);

      const toLink   = checkedIds.filter(id => !originalLinkedChildIds.includes(id));
      const toUnlink = originalLinkedChildIds.filter(id => !checkedIds.includes(id));

      await Promise.all([...toLink, ...toUnlink].map(async (childId) => {
        const child = allChildren.find(c => c.id === childId);
        const currentParentIds = child.parents?.map(p => p.parent.id) || [];
        const updatedParentIds = toLink.includes(childId)
          ? [...currentParentIds, linkParent.id]
          : currentParentIds.filter(pid => pid !== linkParent.id);
        await api.put(`/children/${childId}/parents`, { parentIds: updatedParentIds });
      }));

      setLinkParent(null);
      load();
    } catch (err) {
      setLinkError(err.response?.data?.message || 'Failed to update child links.');
    } finally {
      setLinkSaving(false);
    }
  };

  // ── Table columns ──────────────────────────────────────────────────────────

  const columns = [
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
    {
      key: 'status', label: 'Status',
      render: r => (
        <Badge color={r.isActive === false ? 'gray' : 'green'}>
          {r.isActive === false ? 'Inactive' : 'Active'}
        </Badge>
      ),
    },
    {
      key: 'children', label: 'Linked Children',
      render: r => {
        const linked = r.childParents?.map(cp => `${cp.child.firstName} ${cp.child.lastName}`).join(', ');
        return linked
          ? <span className="text-sm">{linked}</span>
          : <span className="text-gray-400 text-sm">— None linked —</span>;
      },
    },
    {
      key: 'actions', label: '',
      render: r => (
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="secondary" onClick={() => openEdit(r)}>Edit</Button>
          <Button size="sm" variant="danger" onClick={() => setConfirmDelete(r)}>Remove</Button>
          <Button size="sm" variant="secondary" onClick={() => openLink(r)}>Link Children</Button>
        </div>
      ),
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Parents</h1>
        <Button onClick={openCreate}>+ Add Parent</Button>
      </div>

      <Input
        placeholder="Search parents by name or email…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-72"
      />

      <Card>
        <Table
          columns={columns}
          data={parents}
          loading={loading}
          emptyMessage="No parents found."
        />
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editParent ? `Edit – ${editParent.name}` : 'Add Parent'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" form="parent-form" loading={saving}>{editParent ? 'Save' : 'Add'}</Button>
          </>
        }
      >
        <form id="parent-form" onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}
          <Input
            label="Full Name"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            required
          />
          <Input
            label="Email Address"
            type="email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            required
          />
          <Input
            label="Phone (optional)"
            value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            placeholder="+975 17 XXX XXX"
          />
          <Input
            label={editParent ? 'New Password (leave blank to keep)' : 'Password'}
            type="password"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            placeholder="Minimum 8 characters"
            required={!editParent}
          />
        </form>
      </Modal>

      {/* Confirm Remove Modal */}
      <Modal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Remove Account"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => handleRemove(confirmDelete)}>Remove</Button>
          </>
        }
      >
        <p className="text-sm text-gray-700">
          Remove <strong>{confirmDelete?.name}</strong> from this center? Their records are preserved
          but they will lose system access.
        </p>
      </Modal>

      {/* Link Children Modal */}
      <Modal
        isOpen={!!linkParent}
        onClose={() => setLinkParent(null)}
        title={`Link Children – ${linkParent?.name}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setLinkParent(null)}>Cancel</Button>
            <Button loading={linkSaving} onClick={handleLinkSave}>Save</Button>
          </>
        }
      >
        {linkError && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {linkError}
          </div>
        )}
        {allChildren.length === 0 ? (
          <p className="text-sm text-gray-500">No children enrolled in this center yet.</p>
        ) : (
          <div className="max-h-52 overflow-y-auto space-y-0.5 border border-gray-200 rounded-lg p-2">
            {allChildren.map(child => (
              <label
                key={child.id}
                className="flex items-center gap-2 p-1.5 rounded hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={checkedIds.includes(child.id)}
                  onChange={() => toggleChild(child.id)}
                  className="rounded border-gray-300 text-primary-600"
                />
                <span className="text-sm text-gray-900">{child.firstName} {child.lastName}</span>
                <span className="text-xs text-gray-400">{child.class?.name}</span>
              </label>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MgrParents;
