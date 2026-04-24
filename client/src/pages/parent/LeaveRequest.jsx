import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';

const STATUS_COLOR = { PENDING: 'yellow', APPROVED: 'green', REJECTED: 'red' };

const EMPTY_FORM = { childId: '', startDate: '', endDate: '', reason: '' };

const ParentLeaveRequest = () => {
  const [children, setChildren] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [viewRequest, setViewRequest] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get('/children'),
      api.get('/leave'),
    ]).then(([kids, reqs]) => {
      setChildren(kids.data.data);
      setRequests(reqs.data.data);
      // Default to first child
      if (kids.data.data.length > 0 && !form.childId) {
        setForm(f => ({ ...f, childId: kids.data.data[0].id }));
      }
    }).finally(() => setLoading(false));
  }, []); // eslint-disable-line

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setForm({ ...EMPTY_FORM, childId: children[0]?.id || '' });
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (new Date(form.endDate) < new Date(form.startDate)) {
      setError('End date cannot be before start date.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.post('/leave', form);
      setShowModal(false);
      setSuccess('Leave request submitted successfully. Your child\'s teacher will review it.');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit leave request.');
    } finally {
      setSaving(false);
    }
  };

  const childOptions = children.map(c => ({ value: c.id, label: `${c.firstName} ${c.lastName}` }));

  const dayCount = (start, end) => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    return Math.max(1, Math.round((e - s) / 86400000) + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Requests</h1>
          <p className="text-sm text-gray-500 mt-0.5">Request time off for your child</p>
        </div>
        <Button onClick={openNew}>+ New Request</Button>
      </div>

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{success}</div>
      )}

      {loading ? (
        <Card><div className="h-32 flex items-center justify-center text-gray-400">Loading…</div></Card>
      ) : requests.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-gray-500 text-sm">No leave requests yet.</p>
            <Button className="mt-4" onClick={openNew}>Submit a Leave Request</Button>
          </div>
        </Card>
      ) : (
        <Card title="Your Leave Requests">
          <div className="space-y-3">
            {requests.map(r => (
              <div
                key={r.id}
                className="p-4 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => setViewRequest(r)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-gray-900">
                        {r.child?.firstName} {r.child?.lastName}
                      </p>
                      <Badge color={STATUS_COLOR[r.status] || 'gray'}>{r.status}</Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {r.startDate?.slice(0,10)} → {r.endDate?.slice(0,10)}
                      {' '}· {dayCount(r.startDate, r.endDate)} day{dayCount(r.startDate, r.endDate) !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-gray-400 mt-1 truncate max-w-sm">{r.reason}</p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {r.status === 'REJECTED' && r.rejectionReason && (
                  <div className="mt-2 px-3 py-2 bg-red-50 rounded-lg text-xs text-red-700">
                    Reason: {r.rejectionReason}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Status guide */}
      <Card>
        <div className="flex flex-wrap gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Badge color="yellow">PENDING</Badge>
            <span>Awaiting teacher / manager review</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge color="green">APPROVED</Badge>
            <span>Approved — attendance marked EXCUSED</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge color="red">REJECTED</Badge>
            <span>Not approved — see reason</span>
          </div>
        </div>
      </Card>

      {/* New Leave Request Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="New Leave Request"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" form="leave-form" loading={saving}>Submit Request</Button>
          </>
        }
      >
        <form id="leave-form" onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

          {children.length > 1 && (
            <Select
              label="Child"
              value={form.childId}
              onChange={e => setForm(f => ({ ...f, childId: e.target.value }))}
              options={childOptions}
              required
            />
          )}
          {children.length === 1 && (
            <div className="p-3 bg-gray-50 rounded-xl text-sm font-medium text-gray-700">
              For: {children[0]?.firstName} {children[0]?.lastName}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={form.startDate}
              onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
              min={new Date().toISOString().slice(0,10)}
              required
            />
            <Input
              label="End Date"
              type="date"
              value={form.endDate}
              onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
              min={form.startDate || new Date().toISOString().slice(0,10)}
              required
            />
          </div>

          {form.startDate && form.endDate && (
            <p className="text-xs text-gray-500 -mt-2">
              Duration: {dayCount(form.startDate, form.endDate)} day{dayCount(form.startDate, form.endDate) !== 1 ? 's' : ''}
            </p>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Leave <span className="text-red-500">*</span></label>
            <textarea
              className="form-input"
              rows={3}
              value={form.reason}
              onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
              placeholder="Please describe the reason for this leave request…"
              required
            />
          </div>

          <p className="text-xs text-gray-400">
            Once approved, your child's attendance will automatically be marked as Excused for the requested dates.
          </p>
        </form>
      </Modal>

      {/* View Request Detail Modal */}
      <Modal
        isOpen={!!viewRequest}
        onClose={() => setViewRequest(null)}
        title="Leave Request Details"
        footer={<Button variant="secondary" onClick={() => setViewRequest(null)}>Close</Button>}
      >
        {viewRequest && (
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Child</span>
              <span className="font-medium">{viewRequest.child?.firstName} {viewRequest.child?.lastName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Dates</span>
              <span className="font-medium">{viewRequest.startDate?.slice(0,10)} → {viewRequest.endDate?.slice(0,10)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Duration</span>
              <span className="font-medium">{dayCount(viewRequest.startDate, viewRequest.endDate)} days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Status</span>
              <Badge color={STATUS_COLOR[viewRequest.status] || 'gray'}>{viewRequest.status}</Badge>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Reason</p>
              <p className="bg-gray-50 rounded-lg p-3 text-gray-700">{viewRequest.reason}</p>
            </div>
            {viewRequest.status === 'REJECTED' && viewRequest.rejectionReason && (
              <div>
                <p className="text-gray-500 mb-1">Rejection Reason</p>
                <p className="bg-red-50 rounded-lg p-3 text-red-700">{viewRequest.rejectionReason}</p>
              </div>
            )}
            <div className="flex justify-between text-xs text-gray-400">
              <span>Submitted</span>
              <span>{new Date(viewRequest.createdAt).toLocaleString()}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ParentLeaveRequest;
