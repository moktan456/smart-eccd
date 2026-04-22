import { useState, useEffect } from 'react';
import { messageService } from '../../services/message.service';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import { formatRelative } from '../../utils/helpers';

const ParentMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ receiverId: '', subject: '', body: '' });

  const load = () => {
    messageService.getMessages().then(({ data }) => setMessages(data.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleSend = async (e) => {
    e.preventDefault();
    await messageService.send(form);
    setShowModal(false);
    setForm({ receiverId: '', subject: '', body: '' });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <Button onClick={() => setShowModal(true)}>+ New Message</Button>
      </div>
      <Card>
        {loading ? <p>Loading...</p> : messages.length === 0 ? (
          <p className="text-gray-500 text-sm py-8 text-center">No messages yet.</p>
        ) : messages.map(m => (
          <div key={m.id} className={`p-4 border-b border-gray-100 last:border-0 ${!m.status || m.status === 'SENT' ? 'bg-blue-50' : ''}`}>
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium">{m.sender?.name}</span>
              <span className="text-xs text-gray-400">{formatRelative(m.createdAt)}</span>
            </div>
            {m.subject && <p className="text-sm font-semibold text-gray-800 mt-1">{m.subject}</p>}
            <p className="text-sm text-gray-600 mt-1">{m.body}</p>
          </div>
        ))}
      </Card>
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Send Message"
        footer={<><Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button type="submit" form="msg-form">Send</Button></>}>
        <form id="msg-form" onSubmit={handleSend} className="space-y-4">
          <Input label="Recipient User ID" value={form.receiverId} onChange={e => setForm(f=>({...f,receiverId:e.target.value}))} required />
          <Input label="Subject" value={form.subject} onChange={e => setForm(f=>({...f,subject:e.target.value}))} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea className="form-input min-h-[100px]" value={form.body} onChange={e => setForm(f=>({...f,body:e.target.value}))} required />
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default ParentMessages;
