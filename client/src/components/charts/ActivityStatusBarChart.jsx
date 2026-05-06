// MUI X BarChart – Activity assignments by status (Teacher Dashboard)
import { BarChart } from '@mui/x-charts/BarChart';

const STATUS_COLORS = {
  PENDING:     '#fbbf24',
  IN_PROGRESS: 'var(--color-primary-500)',
  COMPLETED:   '#22c55e',
  SKIPPED:     '#d1d5db',
};

const ActivityStatusBarChart = ({ assignments = [] }) => {
  const counts = { PENDING: 0, IN_PROGRESS: 0, COMPLETED: 0, SKIPPED: 0 };
  assignments.forEach(a => { if (counts[a.status] !== undefined) counts[a.status]++; });

  const labels = ['Pending', 'In Progress', 'Completed', 'Skipped'];
  const values = [counts.PENDING, counts.IN_PROGRESS, counts.COMPLETED, counts.SKIPPED];
  const colors = [
    STATUS_COLORS.PENDING, STATUS_COLORS.IN_PROGRESS,
    STATUS_COLORS.COMPLETED, STATUS_COLORS.SKIPPED,
  ];

  return (
    <BarChart
      xAxis={[{ scaleType: 'band', data: labels, tickLabelStyle: { fontSize: 11 } }]}
      series={[{ data: values, label: 'Activities', color: 'var(--color-primary-600)' }]}
      height={200}
      borderRadius={6}
      margin={{ top: 10, bottom: 36, left: 30, right: 10 }}
      colors={colors}
    />
  );
};

export default ActivityStatusBarChart;
