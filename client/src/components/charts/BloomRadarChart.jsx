// SMART ECCD – Bloom's Taxonomy Radar Chart
// Spider chart showing a child's performance across all 6 Bloom levels

import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { BLOOM_LABELS } from '../../utils/constants';

const BloomRadarChart = ({ profile = {}, classAverage = {}, height = 300 }) => {
  const data = Object.entries(BLOOM_LABELS).map(([key, label]) => ({
    level: label,
    child: profile[key] ?? 0,
    class: classAverage[key] ?? 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis dataKey="level" tick={{ fontSize: 12, fill: '#6b7280' }} />
        <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickCount={6} />
        <Radar name="Child" dataKey="child" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} strokeWidth={2} />
        {Object.values(classAverage).some((v) => v > 0) && (
          <Radar name="Class Avg" dataKey="class" stroke="#9ca3af" fill="#9ca3af" fillOpacity={0.1} strokeWidth={1} strokeDasharray="4 4" />
        )}
        <Legend />
        <Tooltip formatter={(value) => `${value}%`} />
      </RadarChart>
    </ResponsiveContainer>
  );
};

export default BloomRadarChart;
