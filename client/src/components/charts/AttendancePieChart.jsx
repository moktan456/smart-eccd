// MUI X PieChart – Attendance present vs absent
import { PieChart } from '@mui/x-charts/PieChart';

const AttendancePieChart = ({ present = 0, total = 0 }) => {
  const absent = Math.max(total - present, 0);

  const data = [
    { id: 0, value: present, label: 'Present', color: '#22c55e' },
    { id: 1, value: absent,  label: 'Absent',  color: '#f3f4f6' },
  ];

  if (total === 0) return <p className="text-sm text-gray-400 text-center py-8">No enrollment data.</p>;

  const pct = total > 0 ? Math.round((present / total) * 100) : 0;

  return (
    <div className="flex items-center gap-6">
      <PieChart
        series={[{
          data,
          innerRadius: 48,
          outerRadius: 72,
          paddingAngle: 2,
          cornerRadius: 4,
          cx: 80,
        }]}
        width={170}
        height={160}
        slotProps={{ legend: { hidden: true } }}
      />
      <div>
        <p className="text-4xl font-bold text-gray-900">{pct}%</p>
        <p className="text-sm text-gray-500 mt-0.5">attendance rate</p>
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span className="text-gray-600">Present: <strong>{present}</strong></span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
            <span className="text-gray-600">Absent: <strong>{absent}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendancePieChart;
