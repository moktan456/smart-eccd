// SMART ECCD – Card Component
import { classNames } from '../../utils/helpers';

const Card = ({ children, className = '', title, action, padding = true }) => (
  <div className={classNames('bg-white rounded-xl shadow-sm border border-gray-100', padding && 'p-5', className)}>
    {(title || action) && (
      <div className="flex items-center justify-between mb-4">
        {title && <h3 className="font-semibold text-gray-900">{title}</h3>}
        {action && <div>{action}</div>}
      </div>
    )}
    {children}
  </div>
);

export const StatCard = ({ label, value, icon: Icon, color = 'bg-primary-50 text-primary-600', change }) => (
  <div className="card flex items-center gap-4">
    {Icon && <div className={`p-3 rounded-xl ${color}`}><Icon className="w-6 h-6" /></div>}
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
      {change !== undefined && <p className={`text-xs ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>{change >= 0 ? '▲' : '▼'} {Math.abs(change)}%</p>}
    </div>
  </div>
);

export default Card;
