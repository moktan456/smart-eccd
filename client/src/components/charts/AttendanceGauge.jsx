// MUI X Gauge – Attendance rate for Teacher Dashboard
import { Gauge, gaugeClasses } from '@mui/x-charts/Gauge';

const AttendanceGauge = ({ present = 0, total = 0 }) => {
  const pct = total > 0 ? Math.round((present / total) * 100) : 0;

  return (
    <div className="flex flex-col items-center gap-2">
      <Gauge
        value={pct}
        startAngle={-110}
        endAngle={110}
        width={180}
        height={120}
        sx={{
          [`& .${gaugeClasses.valueText}`]: {
            fontSize: 24,
            fontWeight: 700,
            fill: 'var(--color-primary-600)',
          },
          [`& .${gaugeClasses.valueArc}`]: {
            fill: 'var(--color-primary-600)',
          },
          [`& .${gaugeClasses.referenceArc}`]: {
            fill: '#f3f4f6',
          },
        }}
        text={({ value }) => `${value}%`}
      />
      <p className="text-xs text-gray-500">{present} of {total} present today</p>
    </div>
  );
};

export default AttendanceGauge;
