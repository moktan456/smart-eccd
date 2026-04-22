// SMART ECCD – Performance Trend Line Chart

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BLOOM_COLORS, BLOOM_LEVELS } from '../../utils/constants';

const TrendLineChart = ({ data = [], height = 300, levels = BLOOM_LEVELS }) => (
  <ResponsiveContainer width="100%" height={height}>
    <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
      <XAxis dataKey="week" tick={{ fontSize: 11 }} />
      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
      <Tooltip formatter={(v) => (v !== null ? `${v}%` : 'No data')} />
      <Legend />
      {levels.map((level) => (
        <Line
          key={level}
          type="monotone"
          dataKey={level}
          stroke={BLOOM_COLORS[level]}
          strokeWidth={2}
          dot={false}
          connectNulls
        />
      ))}
    </LineChart>
  </ResponsiveContainer>
);

export default TrendLineChart;
