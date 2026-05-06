// MUI X PieChart – Bloom's level distribution (Manager / SA Dashboard)
import { PieChart } from '@mui/x-charts/PieChart';
import { BLOOM_LEVELS, BLOOM_COLORS, BLOOM_LABELS } from '../../utils/constants';

const BloomPieChart = ({ coverage = {} }) => {
  const data = BLOOM_LEVELS.map((level, i) => ({
    id: i,
    value: typeof coverage[level] === 'object'
      ? (coverage[level]?.percentage ?? 0)
      : (coverage[level] ?? 0),
    label: BLOOM_LABELS[level],
    color: BLOOM_COLORS[level],
  })).filter(d => d.value > 0);

  if (!data.length) return <p className="text-sm text-gray-400 text-center py-8">No Bloom data yet.</p>;

  return (
    <PieChart
      series={[{
        data,
        outerRadius: 90,
        paddingAngle: 2,
        cornerRadius: 4,
      }]}
      height={220}
      slotProps={{
        legend: {
          direction: 'column',
          position: { vertical: 'middle', horizontal: 'right' },
          itemMarkWidth: 10,
          itemMarkHeight: 10,
          markGap: 5,
          itemGap: 6,
          labelStyle: { fontSize: 11, fill: '#6b7280' },
        },
      }}
    />
  );
};

export default BloomPieChart;
