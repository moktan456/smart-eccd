import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { attendanceService } from '../../services/attendance.service';
import Card from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const STATUS_COLOR = {
  PRESENT: { bg: '#27ae60', text: 'white' },
  ABSENT:  { bg: '#e74c3c', text: 'white' },
  LATE:    { bg: '#f39c12', text: 'white' },
  EXCUSED: { bg: '#2980b9', text: 'white' },
};

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const ParentAttendance = () => {
  const { id } = useParams();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  const load = (y, m) => {
    setLoading(true);
    attendanceService.getAttendanceSummary(id, { year: y, month: m })
      .then(({ data }) => setSummary(data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(year, month); }, [id, year, month]);

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  // Build calendar grid
  const buildCalendar = () => {
    if (!summary) return { blanks: [], days: [] };
    // First day of month (0=Sun)
    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const recordMap = {};
    (summary.records || []).forEach(r => {
      const d = new Date(r.date);
      recordMap[d.getUTCDate()] = r.status;
    });
    return {
      blanks: Array(firstDay).fill(null),
      days: Array.from({ length: daysInMonth }, (_, i) => ({
        day: i + 1,
        status: recordMap[i + 1] || null,
      })),
    };
  };

  const { blanks, days } = buildCalendar();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Attendance Calendar</h1>

      {/* Navigation */}
      <div className="flex items-center gap-4">
        <button
          onClick={prevMonth}
          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 text-lg"
        >
          ‹
        </button>
        <span className="text-base font-semibold text-gray-900 min-w-[140px] text-center">
          {MONTHS[month - 1]} {year}
        </span>
        <button
          onClick={nextMonth}
          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 text-lg"
        >
          ›
        </button>
      </div>

      {loading ? (
        <LoadingSpinner className="mt-12" />
      ) : (
        <>
          {/* Summary counts */}
          <div className="grid grid-cols-4 gap-3">
            {Object.entries(summary?.counts || {}).map(([status, count]) => (
              <div
                key={status}
                className="rounded-xl p-3 text-center"
                style={{ backgroundColor: (STATUS_COLOR[status]?.bg || '#ccc') + '20' }}
              >
                <p className="text-2xl font-bold" style={{ color: STATUS_COLOR[status]?.bg || '#888' }}>{count}</p>
                <p className="text-xs text-gray-600 mt-0.5">{status}</p>
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <Card>
            <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                <div key={d} className="py-1 text-gray-400 font-medium">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {/* Blank offset cells */}
              {blanks.map((_, i) => <div key={`blank-${i}`} />)}
              {/* Day cells */}
              {days.map(({ day, status }) => (
                <div
                  key={day}
                  title={status || 'No record'}
                  className="aspect-square flex items-center justify-center rounded-full text-xs font-medium cursor-default select-none"
                  style={
                    status
                      ? { backgroundColor: STATUS_COLOR[status]?.bg, color: STATUS_COLOR[status]?.text }
                      : { backgroundColor: '#f3f4f6', color: '#9ca3af' }
                  }
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-100">
              {Object.entries(STATUS_COLOR).map(([status, color]) => (
                <div key={status} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color.bg }} />
                  <span className="text-xs text-gray-600">{status}</span>
                </div>
              ))}
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-gray-200" />
                <span className="text-xs text-gray-600">No record</span>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default ParentAttendance;
