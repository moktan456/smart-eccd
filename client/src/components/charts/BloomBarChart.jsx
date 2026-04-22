// SMART ECCD – Bloom's Coverage Bar Chart

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer, ReferenceLine } from 'recharts';
import { BLOOM_COLORS, BLOOM_LABELS } from '../../utils/constants';

const BloomBarChart = ({ coverage = {}, height = 280 }) => {
  const data = Object.entries(coverage).map(([level, info]) => ({
    name: BLOOM_LABELS[level] || level,
    level,
    value: typeof info === 'object' ? info.percentage : info,
    isUnderUtilised: typeof info === 'object' ? info.isUnderUtilised : false,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v) => `${v}%`} />
        <ReferenceLine y={10} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Min 10%', fill: '#ef4444', fontSize: 10 }} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((entry) => (
            <Cell key={entry.level} fill={entry.isUnderUtilised ? '#fca5a5' : BLOOM_COLORS[entry.level]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default BloomBarChart;
