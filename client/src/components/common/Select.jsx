// SMART ECCD – Select Component
import { classNames } from '../../utils/helpers';

const Select = ({ label, error, options = [], placeholder, className = '', required, ...props }) => (
  <div className={className}>
    {label && (
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
    )}
    <select className={classNames('form-input', error && 'border-red-300')} {...props}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((opt) => (
        <option key={opt.value ?? opt} value={opt.value ?? opt}>
          {opt.label ?? opt}
        </option>
      ))}
    </select>
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);

export default Select;
