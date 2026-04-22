import { useState, useEffect } from 'react';
import api from '../../services/api';
import { attendanceService } from '../../services/attendance.service';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import { formatDate } from '../../utils/helpers';

const STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'];
const statusColor = { PRESENT: 'text-green-700 bg-green-100', ABSENT: 'text-red-700 bg-red-100', LATE: 'text-yellow-700 bg-yellow-100', EXCUSED: 'text-blue-700 bg-blue-100' };

const TeacherAttendance = () => {
  const [children, setChildren] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/children').then(({ data }) => {
      setChildren(data.data);
      setAttendance(Object.fromEntries(data.data.map(c => [c.id, 'PRESENT'])));
    });
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);
    try {
      const records = children.map(c => ({ childId: c.id, date, status: attendance[c.id] }));
      await attendanceService.mark(records);
      setSaved(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Mark Attendance</h1>
      <Card>
        <div className="flex items-center gap-4 mb-6">
          <label className="text-sm font-medium text-gray-700">Date:</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="form-input w-40" />
        </div>
        <div className="space-y-3">
          {children.map(child => (
            <div key={child.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
              <span className="text-sm font-medium">{child.firstName} {child.lastName}</span>
              <div className="flex gap-1">
                {STATUSES.map(s => (
                  <button key={s} type="button"
                    onClick={() => setAttendance(a => ({...a, [child.id]: s}))}
                    className={`px-2 py-1 rounded text-xs font-medium transition-all ${attendance[child.id] === s ? statusColor[s] : 'bg-white text-gray-400 border border-gray-200'}`}>
                    {s.charAt(0)}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Button onClick={handleSave} loading={loading}>Save Attendance</Button>
          {saved && <span className="text-sm text-green-600">✓ Saved\!</span>}
        </div>
      </Card>
    </div>
  );
};
export default TeacherAttendance;
