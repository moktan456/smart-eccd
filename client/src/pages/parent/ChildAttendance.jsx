import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { attendanceService } from '../../services/attendance.service';
import Card from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const STATUS_COLOR = { PRESENT: '#27ae60', ABSENT: '#e74c3c', LATE: '#f1c40f', EXCUSED: '#2980b9' };

const ParentAttendance = () => {
  const { id } = useParams();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const now = new Date();
    attendanceService.getAttendanceSummary(id, { year: now.getFullYear(), month: now.getMonth() + 1 })
      .then(({ data }) => setSummary(data.data)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner className="mt-20" />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Attendance Calendar</h1>
      <Card title="This Month Summary">
        <div className="grid grid-cols-4 gap-4 mb-6">
          {Object.entries(summary?.counts || {}).map(([status, count]) => (
            <div key={status} className="text-center p-3 rounded-lg" style={{ backgroundColor: STATUS_COLOR[status] + '20' }}>
              <p className="text-2xl font-bold" style={{ color: STATUS_COLOR[status] }}>{count}</p>
              <p className="text-xs text-gray-600">{status}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 text-xs text-center">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} className="text-gray-400 py-1">{d}</div>)}
          {summary?.records?.map(r => (
            <div key={r.date} title={r.status}
              className="w-8 h-8 mx-auto rounded-full flex items-center justify-center text-white text-xs font-medium"
              style={{ backgroundColor: STATUS_COLOR[r.status] }}>
              {new Date(r.date).getDate()}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
export default ParentAttendance;
