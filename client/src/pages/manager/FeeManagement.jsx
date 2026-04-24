import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import Card, { StatCard } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';

const FREQ_OPTIONS = [
  { value: 'MONTHLY',   label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'ANNUALLY',  label: 'Annually' },
  { value: 'ONE_TIME',  label: 'One-time' },
];

const STATUS_COLOR = {
  PENDING: 'yellow',
  PAID:    'green',
  PARTIAL: 'blue',
  OVERDUE: 'red',
  WAIVED:  'gray',
};

const EMPTY_STRUCT = { name: '', amount: '', frequency: 'MONTHLY', description: '' };

const MgrFeeManagement = () => {
  const [tab, setTab] = useState('structures'); // 'structures' | 'records'

  // --- Fee Structures ---
  const [structures, setStructures] = useState([]);
  const [loadingStructures, setLoadingStructures] = useState(true);
  const [showStructModal, setShowStructModal] = useState(false);
  const [editStruct, setEditStruct] = useState(null);
  const [structForm, setStructForm] = useState(EMPTY_STRUCT);
  const [structSaving, setStructSaving] = useState(false);
  const [structError, setStructError] = useState('');

  // --- Fee Records ---
  const [records, setRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [summary, setSummary] = useState(null);
  const [children, setChildren] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterChild, setFilterChild] = useState('');

  // --- Pay Modal ---
  const [payRecord, setPayRecord] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payNote, setPayNote]     = useState('');
  const [paying, setPaying]       = useState(false);
  const [payError, setPayError]   = useState('');

  // --- Bulk Create Modal ---
  const [showBulk, setShowBulk] = useState(false);
  const [bulkStructId, setBulkStructId] = useState('');
  const [bulkDueDate,  setBulkDueDate]  = useState('');
  const [bulkLoading,  setBulkLoading]  = useState(false);
  const [bulkError,    setBulkError]    = useState('');

  const loadStructures = useCallback(() => {
    setLoadingStructures(true);
    api.get('/fees/structures')
      .then(({ data }) => setStructures(data.data))
      .finally(() => setLoadingStructures(false));
  }, []);

  const loadRecords = useCallback(() => {
    setLoadingRecords(true);
    const params = {};
    if (filterStatus) params.status  = filterStatus;
    if (filterChild)  params.childId = filterChild;
    Promise.all([
      api.get('/fees/records', { params }),
      api.get('/fees/summary'),
    ]).then(([recs, sum]) => {
      setRecords(recs.data.data);
      setSummary(sum.data.data);
    }).finally(() => setLoadingRecords(false));
  }, [filterStatus, filterChild]);

  useEffect(() => {
    loadStructures();
    api.get('/children').then(({ data }) => setChildren(data.data));
  }, [loadStructures]);

  useEffect(() => { if (tab === 'records') loadRecords(); }, [tab, loadRecords]);

  // ── Structures CRUD ──
  const openCreateStruct = () => {
    setEditStruct(null);
    setStructForm(EMPTY_STRUCT);
    setStructError('');
    setShowStructModal(true);
  };
  const openEditStruct = (s) => {
    setEditStruct(s);
    setStructForm({ name: s.name, amount: s.amount, frequency: s.frequency, description: s.description || '' });
    setStructError('');
    setShowStructModal(true);
  };
  const handleStructSubmit = async (e) => {
    e.preventDefault();
    setStructSaving(true);
    setStructError('');
    try {
      const payload = { ...structForm, amount: parseFloat(structForm.amount) };
      if (editStruct) await api.put(`/fees/structures/${editStruct.id}`, payload);
      else            await api.post('/fees/structures', payload);
      setShowStructModal(false);
      loadStructures();
    } catch (err) {
      setStructError(err.response?.data?.message || 'Failed to save fee structure.');
    } finally {
      setStructSaving(false);
    }
  };

  // ── Payment ──
  const openPay = (rec) => {
    setPayRecord(rec);
    setPayAmount('');
    setPayNote('');
    setPayError('');
  };
  const handlePay = async (e) => {
    e.preventDefault();
    setPaying(true);
    setPayError('');
    try {
      await api.post(`/fees/records/${payRecord.id}/pay`, { amount: parseFloat(payAmount), notes: payNote });
      setPayRecord(null);
      loadRecords();
    } catch (err) {
      setPayError(err.response?.data?.message || 'Failed to record payment.');
    } finally {
      setPaying(false);
    }
  };

  // ── Bulk Create ──
  const handleBulk = async (e) => {
    e.preventDefault();
    setBulkLoading(true);
    setBulkError('');
    try {
      await api.post('/fees/records/bulk', { feeStructureId: bulkStructId, dueDate: bulkDueDate });
      setShowBulk(false);
      setTab('records');
      loadRecords();
    } catch (err) {
      setBulkError(err.response?.data?.message || 'Failed to create fee records.');
    } finally {
      setBulkLoading(false);
    }
  };

  // ── Overdue Reminders ──
  const sendReminders = async () => {
    await api.post('/fees/reminders');
    loadRecords();
  };

  const structColumns = [
    {
      key: 'name', label: 'Fee Name',
      render: s => (
        <div>
          <p className="font-medium text-sm">{s.name}</p>
          {s.description && <p className="text-xs text-gray-400">{s.description}</p>}
        </div>
      ),
    },
    {
      key: 'amount', label: 'Amount',
      render: s => <span className="font-semibold text-sm">₱{Number(s.amount).toLocaleString()}</span>,
    },
    {
      key: 'frequency', label: 'Frequency',
      render: s => <Badge color="blue">{s.frequency}</Badge>,
    },
    {
      key: 'actions', label: '',
      render: s => (
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="secondary" onClick={() => openEditStruct(s)}>Edit</Button>
          <Button size="sm" onClick={() => { setBulkStructId(s.id); setBulkDueDate(''); setBulkError(''); setShowBulk(true); }}>
            Bulk Assign
          </Button>
        </div>
      ),
    },
  ];

  const recordColumns = [
    {
      key: 'child', label: 'Child',
      render: r => <span className="text-sm font-medium">{r.child?.firstName} {r.child?.lastName}</span>,
    },
    {
      key: 'fee', label: 'Fee',
      render: r => <span className="text-sm">{r.feeStructure?.name}</span>,
    },
    {
      key: 'amount', label: 'Amount',
      render: r => (
        <div>
          <p className="text-sm font-semibold">₱{Number(r.amount).toLocaleString()}</p>
          {r.paidAmount > 0 && <p className="text-xs text-green-600">Paid: ₱{Number(r.paidAmount).toLocaleString()}</p>}
        </div>
      ),
    },
    {
      key: 'dueDate', label: 'Due Date',
      render: r => <span className="text-sm text-gray-600">{r.dueDate?.slice(0,10)}</span>,
    },
    {
      key: 'status', label: 'Status',
      render: r => <Badge color={STATUS_COLOR[r.status] || 'gray'}>{r.status}</Badge>,
    },
    {
      key: 'actions', label: '',
      render: r => r.status !== 'PAID' && r.status !== 'WAIVED'
        ? <Button size="sm" onClick={() => openPay(r)}>Record Payment</Button>
        : null,
    },
  ];

  const childOptions = [
    { value: '', label: 'All Children' },
    ...children.map(c => ({ value: c.id, label: `${c.firstName} ${c.lastName}` })),
  ];
  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'PAID',    label: 'Paid' },
    { value: 'PARTIAL', label: 'Partial' },
    { value: 'OVERDUE', label: 'Overdue' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Fee Management</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={sendReminders}>Send Overdue Reminders</Button>
          <Button onClick={openCreateStruct}>+ New Fee Type</Button>
        </div>
      </div>

      {/* Summary stats */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Billed"    value={`₱${Number(summary.totalBilled   || 0).toLocaleString()}`} icon="💰" />
          <StatCard label="Total Collected" value={`₱${Number(summary.totalPaid     || 0).toLocaleString()}`} icon="✅" />
          <StatCard label="Outstanding"     value={`₱${Number(summary.totalPending  || 0).toLocaleString()}`} icon="⏳" />
          <StatCard label="Overdue"         value={`₱${Number(summary.totalOverdue  || 0).toLocaleString()}`} icon="🚨" />
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {[['structures','Fee Types'],['records','Fee Records']].map(([key,label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === key ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Fee Structures tab */}
      {tab === 'structures' && (
        <Card>
          <Table columns={structColumns} data={structures} loading={loadingStructures} emptyMessage="No fee types defined yet." />
        </Card>
      )}

      {/* Fee Records tab */}
      {tab === 'records' && (
        <Card>
          <div className="flex gap-3 mb-4 flex-wrap">
            <div className="w-48">
              <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} options={statusOptions} />
            </div>
            <div className="w-56">
              <Select value={filterChild} onChange={e => setFilterChild(e.target.value)} options={childOptions} />
            </div>
          </div>
          <Table columns={recordColumns} data={records} loading={loadingRecords} emptyMessage="No fee records found." />
        </Card>
      )}

      {/* Create / Edit Fee Structure Modal */}
      <Modal
        isOpen={showStructModal}
        onClose={() => setShowStructModal(false)}
        title={editStruct ? 'Edit Fee Type' : 'New Fee Type'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowStructModal(false)}>Cancel</Button>
            <Button type="submit" form="struct-form" loading={structSaving}>{editStruct ? 'Save' : 'Create'}</Button>
          </>
        }
      >
        <form id="struct-form" onSubmit={handleStructSubmit} className="space-y-4">
          {structError && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{structError}</div>}
          <Input label="Fee Name" value={structForm.name} onChange={e => setStructForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Monthly Tuition" required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Amount (₱)" type="number" min={0} step="0.01" value={structForm.amount} onChange={e => setStructForm(f=>({...f,amount:e.target.value}))} required />
            <Select label="Frequency" value={structForm.frequency} onChange={e => setStructForm(f=>({...f,frequency:e.target.value}))} options={FREQ_OPTIONS} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
            <textarea className="form-input" rows={2} value={structForm.description} onChange={e => setStructForm(f=>({...f,description:e.target.value}))} />
          </div>
        </form>
      </Modal>

      {/* Bulk Assign Modal */}
      <Modal
        isOpen={showBulk}
        onClose={() => setShowBulk(false)}
        title="Bulk Assign Fee to All Students"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowBulk(false)}>Cancel</Button>
            <Button type="submit" form="bulk-form" loading={bulkLoading}>Create Records</Button>
          </>
        }
      >
        <form id="bulk-form" onSubmit={handleBulk} className="space-y-4">
          {bulkError && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{bulkError}</div>}
          <p className="text-sm text-gray-600">
            This will create a fee record for every enrolled student for the selected fee type.
          </p>
          <Select
            label="Fee Type"
            value={bulkStructId}
            onChange={e => setBulkStructId(e.target.value)}
            options={[{ value: '', label: 'Select fee type…' }, ...structures.map(s => ({ value: s.id, label: `${s.name} — ₱${Number(s.amount).toLocaleString()}` }))]}
            required
          />
          <Input label="Due Date" type="date" value={bulkDueDate} onChange={e => setBulkDueDate(e.target.value)} required />
        </form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        isOpen={!!payRecord}
        onClose={() => setPayRecord(null)}
        title="Record Payment"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPayRecord(null)}>Cancel</Button>
            <Button type="submit" form="pay-form" loading={paying}>Record</Button>
          </>
        }
      >
        {payRecord && (
          <form id="pay-form" onSubmit={handlePay} className="space-y-4">
            {payError && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{payError}</div>}
            <div className="p-3 bg-gray-50 rounded-xl text-sm">
              <p className="font-medium">{payRecord.child?.firstName} {payRecord.child?.lastName}</p>
              <p className="text-gray-500">{payRecord.feeStructure?.name} · Total: ₱{Number(payRecord.amount).toLocaleString()}</p>
              {payRecord.paidAmount > 0 && <p className="text-green-600">Already paid: ₱{Number(payRecord.paidAmount).toLocaleString()}</p>}
              <p className="text-gray-600 font-medium mt-1">Balance: ₱{Number(payRecord.amount - payRecord.paidAmount).toLocaleString()}</p>
            </div>
            <Input
              label="Payment Amount (₱)"
              type="number" min={0.01} step="0.01"
              max={payRecord.amount - payRecord.paidAmount}
              value={payAmount}
              onChange={e => setPayAmount(e.target.value)}
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
              <textarea className="form-input" rows={2} value={payNote} onChange={e => setPayNote(e.target.value)} placeholder="Receipt #, payment method…" />
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default MgrFeeManagement;
