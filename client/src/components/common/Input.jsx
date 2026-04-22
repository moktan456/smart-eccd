// SMART ECCD – Input Component
import { classNames } from '../../utils/helpers';

const Input = ({ label, error, helpText, className = '', required, ...props }) => (
  <div className={className}>
    {label && (
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
    )}
    <input
      className={classNames(
        'form-input',
        error && 'border-red-300 focus:ring-red-500'
      )}
      {...props}
    />
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    {helpText && !error && <p className="mt-1 text-xs text-gray-500">{helpText}</p>}
  </div>
);

export default Input;
