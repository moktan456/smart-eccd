import { useState, useEffect, useRef } from 'react';
import { messageService } from '../../services/message.service';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import { formatRelative } from '../../utils/helpers';

const ParentMessages = () => {
  const [messages, setMessages] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ receiverId: '', subject: '', body: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [selectedMsg, setSelectedMsg] = useState(null);

  const load = () => {
    setLoading(true);
    messageService.getMessages().then(({ data }) => setMessages(data.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // Load the child's teacher as the default contact
  useEffect(() => {
    api.get('/children').then(({ data }) => {
      const kids = data.data || [];
      // Collect unique teachers from each child's class
      const teachers = [];
      const seen = new Set();
      kids.forEach(child => {
        const t = child.class?.teacher;
        if (t && !seen.has(t.id)) {
          seen.add(t.id);
          teachers.push({ ...t, role: 'TEACHER', label: `${t.name} (Teacher – ${child.class?.name})` });
        }
      });
      setContacts(teachers);
      if (teachers.length > 0) setForm(f => ({ ...f, receiverId: teachers[0].id }));
    });
  }, []);

  const openCompose = () => {
    setError('');
    setForm(f => ({ ...f, subject: '', body: '' }));
    setShowModal(true);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await messageService.send({ receiverId: form.receiverId, subject: form.subject, body: form.body });
      setShowModal(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message.');
    } finally {
      setSaving(false);
    }
  };

  const openMessage = async (msg) => {
    setSelectedMsg(msg);
    if (!msg.status || msg.status === 'SENT') {
      await messageService.markRead(msg.id).catch(() => {});
      setMessages(m => m.map(x => x.id === msg.id ? { ...x, status: 'READ' } : x));
    }
  };

  const unread = messages.filter(m => !m.status || m.status === 'SENT').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          {unread > 0 && <Badge color="blue">{unread} new</Badge>}
        </div>
        <Button onClick={openCompose} disabled={contacts.length === 0}>+ New Message</Button>
      </div>

      {contacts.length === 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
          Your child's class has not been assigned a teacher yet. Messages will be available once a teacher is assigned.
        </div>
      )}

      <Card>
        {loading ? (
          <p className="text-gray-400 text-sm text-center py-8">Loading messages…</p>
        ) : messages.length === 0 ? (
          <p className="text-gray-500 text-sm py-8 text-center">No messages yet. Tap "+ New Message" to reach your child's teacher.</p>
        ) : (
          <div>
            {messages.map(m => (
              <div
                key={m.id}
                onClick={() => openMessage(m)}
                className={`p-4 border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50 transition-colors ${(!m.status || m.status === 'SENT') ? 'bg-blue-50/40' : ''}`}
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-sm font-bold flex-shrink-0">
                      {m.sender?.name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">{m.sender?.name}</span>
                        {(!m.status || m.status === 'SENT') && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                        )}
                      </div>
                      {m.subject && <p className="text-sm font-medium text-gray-800">{m.subject}</p>}
                      <p className="text-sm text-gray-600 line-clamp-1">{m.body}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">{formatRelative(m.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Compose Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="New Message"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" form="msg-form" loading={saving}>Send</Button>
          </>
        }
      >
        <form id="msg-form" onSubmit={handleSend} className="space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
            {contacts.length > 1 ? (
              <select
                className="form-input"
                value={form.receiverId}
                onChange={e => setForm(f => ({ ...f, receiverId: e.target.value }))}
                required
              >
                {contacts.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            ) : contacts.length === 1 ? (
              <div className="flex items-center gap-2 p-2.5 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-bold">
                  {contacts[0].name.charAt(0)}
                </div>
                <span className="text-sm text-gray-900">{contacts[0].label}</span>
              </div>
            ) : null}
          </div>

          <Input
            label="Subject (optional)"
            value={form.subject}
            onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              className="form-input min-h-[100px]"
              value={form.body}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              required
              placeholder="Type your message here…"
            />
          </div>
        </form>
      </Modal>

      {/* View Message Modal */}
      <Modal
        isOpen={!!selectedMsg}
        onClose={() => setSelectedMsg(null)}
        title={selectedMsg?.subject || 'Message'}
        footer={<Button variant="secondary" onClick={() => setSelectedMsg(null)}>Close</Button>}
      >
        {selectedMsg && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>From: <strong className="text-gray-900">{selectedMsg.sender?.name}</strong></span>
              <span>·</span>
              <span>{formatRelative(selectedMsg.createdAt)}</span>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl text-sm text-gray-800 whitespace-pre-wrap">
              {selectedMsg.body}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ParentMessages;
