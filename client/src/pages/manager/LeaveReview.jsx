import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';

const STATUS_COLOR = { PENDING: 'yellow', APPROVED: 'green', REJECTED: 'red' };

const MgrLeaveReview = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('PENDING');
  const [reviewing, setReviewing] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const params = filter ? { status: filter } : {};
    api.get('/leave/all', { params })
      .then(({ data }) => setRequests(data.data))
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handleReview = async (status) => {
    setSaving(true);
    try {
      await api.put(`/leave/${reviewing.id}/review`, {
        status,
        rejectionReason: status === 'REJECTED' ? rejectionReason : undefined,
      });
      setReviewing(null);
      setRejectionReason('');
      load();
    } finally {
      setSaving(false);
    }
  };

  const dayCount = (start, end) => {
    if (!start || !end) return 0;
    return Math.max(1, Math.round((new Date(end) - new Date(start)) / 86400000) + 1);
  };

  const FILTERS = [
    { value: 'PENDING',  label: 'Pending' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: '',         label: 'All' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Leave Requests</h1>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <Card>
        {loading ? (
          <div className="h-32 flex items-center justify-center text-gray-400">Loading…</div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No {filter.toLowerCase() || ''} leave requests.</div>
        ) : (
          <div className="space-y-3">
            {requests.map(r => (
              <div
                key={r.id}
                className="p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm flex-shrink-0">
                    {r.child?.firstName?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{r.child?.firstName} {r.child?.lastName}</span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-gray-500">{r.child?.class?.name || 'No class'}</span>
                      <Badge color={STATUS_COLOR[r.status] || 'gray'}>{r.status}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5">
                      {r.startDate?.slice(0,10)} → {r.endDate?.slice(0,10)}
                      {' '}· {dayCount(r.startDate, r.endDate)} day{dayCount(r.startDate, r.endDate) !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-gray-400 mt-1 truncate">{r.reason}</p>
                    {r.status === 'REJECTED' && r.rejectionReason && (
                      <p className="text-xs text-red-600 mt-1">Rejected: {r.rejectionReason}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      By: {r.parent?.name} · {new Date(r.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {r.status === 'PENDING' && (
                    <Button size="sm" onClick={() => { setReviewing(r); setRejectionReason(''); }}>
                      Review
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Review Modal */}
      <Modal
        isOpen={!!reviewing}
        onClose={() => setReviewing(null)}
        title="Review Leave Request"
        footer={
          <div className="flex gap-2 w-full">
            <Button variant="secondary" onClick={() => setReviewing(null)} className="flex-1">Cancel</Button>
            <Button variant="danger"    onClick={() => handleReview('REJECTED')} loading={saving} className="flex-1">Reject</Button>
            <Button                    onClick={() => handleReview('APPROVED')} loading={saving} className="flex-1">Approve</Button>
          </div>
        }
      >
        {reviewing && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-xl text-sm space-y-1">
              <p><span className="text-gray-500">Child:</span> <span className="font-medium">{reviewing.child?.firstName} {reviewing.child?.lastName}</span></p>
              <p><span className="text-gray-500">Dates:</span> {reviewing.startDate?.slice(0,10)} → {reviewing.endDate?.slice(0,10)} ({dayCount(reviewing.startDate, reviewing.endDate)} days)</p>
              <p><span className="text-gray-500">Parent:</span> {reviewing.parent?.name}</p>
              <p className="text-gray-500 mt-2">Reason:</p>
              <p className="text-gray-700">{reviewing.reason}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rejection reason (if rejecting)</label>
              <textarea
                className="form-input"
                rows={2}
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="Required if rejecting…"
              />
            </div>
            <p className="text-xs text-gray-400">
              Approving will automatically mark attendance as <strong>EXCUSED</strong> for all days in the requested range.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MgrLeaveReview;
