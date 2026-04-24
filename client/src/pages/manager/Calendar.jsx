import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const EVENT_COLORS = {
  HOLIDAY:  { bg: '#EF4444', text: 'white' },
  EXAM:     { bg: '#8B5CF6', text: 'white' },
  FUNCTION: { bg: '#F59E0B', text: 'white' },
  MEETING:  { bg: '#3B82F6', text: 'white' },
  ACTIVITY: { bg: '#10B981', text: 'white' },
  OTHER:    { bg: '#6B7280', text: 'white' },
};

const EVENT_TYPE_OPTIONS = [
  { value: 'HOLIDAY',  label: '🎉 Holiday' },
  { value: 'EXAM',     label: '📝 Exam / Assessment' },
  { value: 'FUNCTION', label: '🎊 School Function' },
  { value: 'MEETING',  label: '👥 Meeting' },
  { value: 'ACTIVITY', label: '🏃 Activity' },
  { value: 'OTHER',    label: '📌 Other' },
];

const EMPTY_FORM = { title: '', description: '', eventType: 'OTHER', startDate: '', endDate: '', isPublic: true };

const MgrCalendar = () => {
  const [events, setEvents] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    api.get('/calendar', { params: { year, month } })
      .then(({ data }) => setEvents(data.data))
      .finally(() => setLoading(false));
  }, [year, month]);

  useEffect(() => { load(); }, [load]);

  const prevMonth = () => { if (month === 1) { setYear(y=>y-1); setMonth(12); } else setMonth(m=>m-1); };
  const nextMonth = () => { if (month === 12) { setYear(y=>y+1); setMonth(1); } else setMonth(m=>m+1); };

  // Build calendar grid
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  // Map day → events
  const dayEvents = {};
  events.forEach(e => {
    const start = new Date(e.startDate);
    const end   = new Date(e.endDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (d.getMonth() + 1 === month && d.getFullYear() === year) {
        const key = d.getDate();
        if (!dayEvents[key]) dayEvents[key] = [];
        dayEvents[key].push(e);
      }
    }
  });

  const openCreate = (day) => {
    setEditEvent(null);
    const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    setForm({ ...EMPTY_FORM, startDate: dateStr, endDate: dateStr });
    setError('');
    setShowModal(true);
  };

  const openEdit = (ev) => {
    setEditEvent(ev);
    setForm({
      title:       ev.title,
      description: ev.description || '',
      eventType:   ev.eventType,
      startDate:   ev.startDate.slice(0, 10),
      endDate:     ev.endDate.slice(0, 10),
      isPublic:    ev.isPublic,
    });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editEvent) {
        await api.put(`/calendar/${editEvent.id}`, form);
      } else {
        await api.post('/calendar', form);
      }
      setShowModal(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save event.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ev) => {
    await api.delete(`/calendar/${ev.id}`);
    setShowModal(false);
    load();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Academic Calendar</h1>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-lg">‹</button>
          <span className="text-lg font-semibold text-gray-900 min-w-[160px] text-center">{MONTHS[month-1]} {year}</span>
          <button onClick={nextMonth} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-lg">›</button>
        </div>
        <Button onClick={() => openCreate(new Date().getDate())}>+ Add Event</Button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(EVENT_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5 text-xs">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color.bg }} />
            <span className="text-gray-600">{type}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <Card>
        <div className="grid grid-cols-7 text-center text-xs text-gray-400 font-medium mb-2">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} className="py-1">{d}</div>)}
        </div>
        {loading ? (
          <div className="h-64 flex items-center justify-center text-gray-400">Loading…</div>
        ) : (
          <div className="grid grid-cols-7 gap-px bg-gray-100 border border-gray-100 rounded-xl overflow-hidden">
            {Array(firstDay).fill(null).map((_, i) => (
              <div key={`b${i}`} className="bg-white min-h-[80px]" />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const isToday = new Date().getDate() === day && new Date().getMonth()+1 === month && new Date().getFullYear() === year;
              const evts = dayEvents[day] || [];
              return (
                <div
                  key={day}
                  className="bg-white min-h-[80px] p-1 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => openCreate(day)}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mb-1 ${isToday ? 'bg-primary-600 text-white' : 'text-gray-700'}`}>
                    {day}
                  </div>
                  {evts.slice(0, 2).map(ev => (
                    <div
                      key={ev.id}
                      onClick={e => { e.stopPropagation(); openEdit(ev); }}
                      className="text-xs px-1 py-0.5 rounded truncate mb-0.5 cursor-pointer hover:opacity-80"
                      style={{ backgroundColor: (EVENT_COLORS[ev.eventType]?.bg || '#6b7280') + '20', color: EVENT_COLORS[ev.eventType]?.bg || '#6b7280', border: `1px solid ${EVENT_COLORS[ev.eventType]?.bg || '#6b7280'}40` }}
                    >
                      {ev.title}
                    </div>
                  ))}
                  {evts.length > 2 && <div className="text-xs text-gray-400">+{evts.length - 2} more</div>}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Event list below calendar */}
      {events.length > 0 && (
        <Card title="This Month's Events">
          <div className="space-y-2">
            {events.map(ev => (
              <div key={ev.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer" onClick={() => openEdit(ev)}>
                <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: EVENT_COLORS[ev.eventType]?.bg }} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{ev.title}</p>
                  <p className="text-xs text-gray-500">{ev.startDate.slice(0,10)} → {ev.endDate.slice(0,10)} · {ev.eventType}</p>
                  {ev.description && <p className="text-xs text-gray-400 mt-0.5">{ev.description}</p>}
                </div>
                {!ev.isPublic && <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Internal</span>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editEvent ? 'Edit Event' : 'New Event'}
        footer={
          <div className="flex gap-2 w-full justify-between">
            {editEvent && <Button variant="danger" onClick={() => handleDelete(editEvent)}>Delete</Button>}
            <div className="flex gap-2 ml-auto">
              <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button type="submit" form="event-form" loading={saving}>Save</Button>
            </div>
          </div>
        }
      >
        <form id="event-form" onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
          <Input label="Event Title" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} required />
          <Select label="Event Type" value={form.eventType} onChange={e=>setForm(f=>({...f,eventType:e.target.value}))} options={EVENT_TYPE_OPTIONS} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date" type="date" value={form.startDate} onChange={e=>setForm(f=>({...f,startDate:e.target.value}))} required />
            <Input label="End Date"   type="date" value={form.endDate}   onChange={e=>setForm(f=>({...f,endDate:e.target.value}))}   required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
            <textarea className="form-input" rows={2} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isPublic} onChange={e=>setForm(f=>({...f,isPublic:e.target.checked}))} className="rounded" />
            <span className="text-sm text-gray-700">Visible to parents</span>
          </label>
        </form>
      </Modal>
    </div>
  );
};

export default MgrCalendar;
