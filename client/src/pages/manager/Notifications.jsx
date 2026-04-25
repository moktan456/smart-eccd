import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';

const TYPE_OPTIONS = [
  { value: 'GENERAL',      label: '📢 General Notice' },
  { value: 'EVENT',        label: '🎊 Event / Function' },
  { value: 'FEE_REMINDER', label: '💰 Fee Reminder' },
  { value: 'ATTENDANCE',   label: '📋 Attendance Alert' },
];

const TYPE_COLOR = {
  GENERAL:      'blue',
  EVENT:        'purple',
  FEE_REMINDER: 'yellow',
  ATTENDANCE:   'red',
};

const EMPTY_FORM = { title: '', message: '', type: 'GENERAL', targetRole: 'PARENT' };

const MgrNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [showModal, setShowModal]         = useState(false);
  const [form, setForm]                   = useState(EMPTY_FORM);
  const [sending, setSending]             = useState(false);
  const [error, setError]                 = useState('');
  const [success, setSuccess]             = useState('');

  const load = useCallback(() => {
    setLoading(true);
    api.get('/notifications/sent')
      .then(({ data }) => setNotifications(data.data || []))
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSend = async (e) => {
    e.preventDefault();
    setSending(true);
    setError('');
    try {
      await api.post('/notifications/broadcast', form);
      setShowModal(false);
      setSuccess(`Notice "${form.title}" sent to all ${form.targetRole.toLowerCase()}s.`);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send notification.');
    } finally {
      setSending(false);
    }
  };

  const TARGET_OPTIONS = [
    { value: 'PARENT',  label: 'All Parents' },
    { value: 'TEACHER', label: 'All Teachers' },
    { value: 'ALL',     label: 'Everyone (Parents + Teachers)' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-0.5">Send notices and announcements to parents and staff</p>
        </div>
        <Button onClick={() => { setShowModal(true); setError(''); setSuccess(''); }}>
          + Send Notice
        </Button>
      </div>

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 flex justify-between items-center">
          <span>✅ {success}</span>
          <button onClick={() => setSuccess('')} className="text-green-500 font-bold">×</button>
        </div>
      )}

      {/* Quick send cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: '📅', label: 'Event Reminder', type: 'EVENT',        msg: 'Reminder: upcoming school event. Please check the calendar for details.' },
          { icon: '💰', label: 'Fee Due',        type: 'FEE_REMINDER', msg: 'This is a reminder that monthly fees are due. Please settle at your earliest convenience.' },
          { icon: '🏫', label: 'School Notice',  type: 'GENERAL',      msg: 'Important notice from the center management. Please read carefully.' },
          { icon: '📋', label: 'Attendance',     type: 'ATTENDANCE',   msg: 'Please ensure your child attends regularly. Contact us for any absence.' },
        ].map(q => (
          <button
            key={q.type}
            onClick={() => { setForm({ title: q.label, message: q.msg, type: q.type, targetRole: 'PARENT' }); setShowModal(true); setError(''); }}
            className="p-4 rounded-2xl border-2 border-dashed border-gray-200 hover:border-primary-300 hover:bg-primary-50 text-center transition-all"
          >
            <p className="text-2xl mb-2">{q.icon}</p>
            <p className="text-sm font-medium text-gray-700">{q.label}</p>
            <p className="text-xs text-gray-400 mt-1">Quick send</p>
          </button>
        ))}
      </div>

      {/* Sent notifications history */}
      <Card title="Sent Notifications">
        {loading ? (
          <div className="h-24 flex items-center justify-center text-gray-400">Loading…</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-3xl mb-2">📭</p>
            <p className="text-sm">No notifications sent yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => (
              <div key={n.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold">{n.title}</p>
                    <Badge color={TYPE_COLOR[n.type] || 'gray'}>{n.type?.replace('_', ' ')}</Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Send Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Send Notification"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" form="notif-form" loading={sending}>Send Now</Button>
          </>
        }
      >
        <form id="notif-form" onSubmit={handleSend} className="space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
          <Input
            label="Title"
            value={form.title}
            onChange={e => setForm(f=>({...f,title:e.target.value}))}
            placeholder="e.g. School Closed on Friday"
            required
          />
          <Select
            label="Type"
            value={form.type}
            onChange={e => setForm(f=>({...f,type:e.target.value}))}
            options={TYPE_OPTIONS}
          />
          <Select
            label="Send To"
            value={form.targetRole}
            onChange={e => setForm(f=>({...f,targetRole:e.target.value}))}
            options={TARGET_OPTIONS}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message <span className="text-red-500">*</span></label>
            <textarea
              className="form-input"
              rows={4}
              value={form.message}
              onChange={e => setForm(f=>({...f,message:e.target.value}))}
              placeholder="Write your message here…"
              required
            />
          </div>
          <p className="text-xs text-gray-400">
            This will create an in-app notification for all {form.targetRole === 'ALL' ? 'parents and teachers' : form.targetRole.toLowerCase() + 's'} in your center.
          </p>
        </form>
      </Modal>
    </div>
  );
};

export default MgrNotifications;
