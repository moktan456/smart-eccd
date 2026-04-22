// SMART ECCD – Badge Component
import { BLOOM_COLORS, BLOOM_LABELS } from '../../utils/constants';
import { classNames } from '../../utils/helpers';

export const BloomBadge = ({ level }) => (
  <span
    className="bloom-badge"
    style={{ backgroundColor: BLOOM_COLORS[level] }}
  >
    {BLOOM_LABELS[level] || level}
  </span>
);

const colorMap = {
  green:  'bg-green-100 text-green-800',
  red:    'bg-red-100 text-red-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  blue:   'bg-blue-100 text-blue-800',
  gray:   'bg-gray-100 text-gray-700',
  purple: 'bg-purple-100 text-purple-800',
};

const Badge = ({ children, color = 'gray', className = '' }) => (
  <span className={classNames('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', colorMap[color], className)}>
    {children}
  </span>
);

export default Badge;
