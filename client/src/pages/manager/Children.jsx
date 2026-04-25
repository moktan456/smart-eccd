import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { userService } from '../../services/user.service';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { formatDate } from '../../utils/helpers';

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  classId: '',
  medicalNotes: '',
  parentIds: [],
};

const MgrChildren = () => {
  const [children, setChildren] = useState([]);
  const [classes, setClasses] = useState([]);
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editChild, setEditChild] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [newStudentId, setNewStudentId] = useState(null); // shown after successful enrolment

  const load = useCallback(() => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (classFilter) params.classId = classFilter;
    api.get('/children', { params })
      .then(({ data }) => setChildren(data.data))
      .finally(() => setLoading(false));
  }, [search, classFilter]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    api.get('/classes?limit=100').then(({ data }) => setClasses(data.data));
    userService.list({ role: 'PARENT', limit: 100 }).then(({ data }) => setParents(data.data));
  }, []);

  const classOptions = [
    { value: '', label: '— Select Class —' },
    ...classes.map(c => ({ value: c.id, label: c.name })),
  ];

  const classFilterOptions = [
    { value: '', label: 'All Classes' },
    ...classes.map(c => ({ value: c.id, label: c.name })),
  ];

  const openCreate = () => {
    setEditChild(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowModal(true);
  };

  const openEdit = (child) => {
    setEditChild(child);
    setForm({
      firstName: child.firstName,
      lastName: child.lastName,
      dateOfBirth: child.dateOfBirth ? child.dateOfBirth.slice(0, 10) : '',
      classId: child.class?.id || '',
      medicalNotes: '',
      parentIds: child.parents?.map(p => p.parent.id) || [],
    });
    setError('');
    setShowModal(true);
  };

  const toggleParent = (parentId) => {
    setForm(f => ({
      ...f,
      parentIds: f.parentIds.includes(parentId)
        ? f.parentIds.filter(id => id !== parentId)
        : [...f.parentIds, parentId],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        dateOfBirth: form.dateOfBirth,
        classId: form.classId,
        parentIds: form.parentIds,
      };
      if (form.medicalNotes) payload.medicalNotes = form.medicalNotes;

      if (editChild) {
        await api.put(`/children/${editChild.id}`, payload);
        setShowModal(false);
      } else {
        const { data } = await api.post('/children', payload);
        setShowModal(false);
        setNewStudentId(data.data.studentId); // show the generated ID
      }
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save child record.');
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async (child) => {
    await api.delete(`/children/${child.id}`);
    setConfirmDelete(null);
    load();
  };

  const columns = [
    {
      key: 'name', label: 'Child',
      render: r => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-sm font-bold flex-shrink-0">
            {r.firstName.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-sm">{r.firstName} {r.lastName}</p>
            <p className="text-xs text-gray-500">Born {formatDate(r.dateOfBirth)}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'studentId', label: 'Student ID',
      render: r => (
        <span className="text-xs font-mono bg-gray-100 text-gray-700 px-2 py-1 rounded-md">
          {r.studentId || '—'}
        </span>
      ),
    },
    { key: 'class', label: 'Class', render: r => r.class?.name || <span className="text-gray-400 text-sm">—</span> },
    {
      key: 'parents', label: 'Parent(s)',
      render: r => r.parents?.length
        ? r.parents.map(p => p.parent?.name).join(', ')
        : <span className="text-gray-400 text-sm">— None linked —</span>,
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
        <h1 className="text-2xl font-bold text-gray-900">Children</h1>
        <Button onClick={openCreate}>+ Enrol Child</Button>
      </div>

      {/* Student ID success banner */}
      {newStudentId && (
        <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl">
          <div className="flex items-center gap-3">
            <span className="text-green-600 text-xl">✅</span>
            <div>
              <p className="text-sm font-semibold text-green-800">Child enrolled successfully!</p>
              <p className="text-sm text-green-700">
                Student ID: <span className="font-mono font-bold text-lg tracking-wide">{newStudentId}</span>
                <span className="ml-2 text-xs text-green-600">— Share this with the parent to register their account</span>
              </p>
            </div>
          </div>
          <button onClick={() => setNewStudentId(null)} className="text-green-500 hover:text-green-700 text-lg font-bold">×</button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Search by name…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="sm:w-56"
        />
        <Select
          value={classFilter}
          onChange={e => setClassFilter(e.target.value)}
          options={classFilterOptions}
          className="sm:w-48"
        />
      </div>

      <Card>
        <Table columns={columns} data={children} loading={loading} emptyMessage="No children enrolled yet." />
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editChild ? `Edit – ${editChild.firstName} ${editChild.lastName}` : 'Enrol New Child'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" form="child-form" loading={saving}>
              {editChild ? 'Save Changes' : 'Enrol Child'}
            </Button>
          </>
        }
      >
        <form id="child-form" onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
          {!editChild && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
              <span>🪪</span>
              <span>A unique <strong>Student ID</strong> (e.g. STU-2026-0001) will be auto-generated and shown after enrolment. Share it with the parent so they can register their account.</span>
            </div>
          )}
          {editChild && editChild.studentId && (
            <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700">
              <span>🪪</span>
              <span>Student ID: <strong className="font-mono text-sm">{editChild.studentId}</strong></span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={form.firstName}
              onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
              required
            />
            <Input
              label="Last Name"
              value={form.lastName}
              onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date of Birth"
              type="date"
              value={form.dateOfBirth}
              onChange={e => setForm(f => ({ ...f, dateOfBirth: e.target.value }))}
              required
            />
            <Select
              label="Class"
              value={form.classId}
              onChange={e => setForm(f => ({ ...f, classId: e.target.value }))}
              options={classOptions}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Medical Notes <span className="text-gray-400 font-normal">(optional, encrypted)</span>
            </label>
            <textarea
              className="form-input"
              rows={2}
              value={form.medicalNotes}
              onChange={e => setForm(f => ({ ...f, medicalNotes: e.target.value }))}
              placeholder="Allergies, conditions, special needs…"
            />
          </div>

          {parents.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Link Parent Account(s)</label>
              <div className="max-h-40 overflow-y-auto space-y-1 border border-gray-200 rounded-lg p-2">
                {parents.map(p => (
                  <label key={p.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.parentIds.includes(p.id)}
                      onChange={() => toggleParent(p.id)}
                      className="rounded border-gray-300 text-primary-600"
                    />
                    <span className="text-sm text-gray-900">{p.name}</span>
                    <span className="text-xs text-gray-500">{p.email}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </form>
      </Modal>

      {/* Confirm Archive */}
      <Modal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Archive Child Record"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => handleArchive(confirmDelete)}>Archive</Button>
          </>
        }
      >
        <p className="text-sm text-gray-700">
          Archive <strong>{confirmDelete?.firstName} {confirmDelete?.lastName}</strong>? All their activity
          and attendance records are preserved. This can be undone by an admin.
        </p>
      </Modal>
    </div>
  );
};

export default MgrChildren;
