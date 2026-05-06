// MUI X BarChart – Centers enrollment comparison (SuperAdmin Dashboard)
import { BarChart } from '@mui/x-charts/BarChart';

const CentersBarChart = ({ centers = [] }) => {
  if (!centers.length) return <p className="text-sm text-gray-400 text-center py-8">No centers data.</p>;

  const labels   = centers.map(c => c.name.length > 12 ? c.name.slice(0, 12) + '…' : c.name);
  const children = centers.map(c => c._count?.children ?? 0);
  const classes  = centers.map(c => c._count?.classes  ?? 0);

  return (
    <BarChart
      xAxis={[{ scaleType: 'band', data: labels, tickLabelStyle: { fontSize: 11 } }]}
      series={[
        { data: children, label: 'Children', color: 'var(--color-primary-600)' },
        { data: classes,  label: 'Classes',  color: 'var(--color-primary-200, #c7d2fe)' },
      ]}
      height={260}
      borderRadius={6}
      margin={{ top: 20, bottom: 40, left: 40, right: 20 }}
    />
  );
};

export default CentersBarChart;
