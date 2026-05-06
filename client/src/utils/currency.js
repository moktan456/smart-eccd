// SMART ECCD – Currency utilities

export const CURRENCIES = [
  { code: 'USD', symbol: '$',   label: 'US Dollar',            flag: '🇺🇸' },
  { code: 'AUD', symbol: 'A$',  label: 'Australian Dollar',    flag: '🇦🇺' },
  { code: 'BTN', symbol: 'Nu.', label: 'Bhutanese Ngultrum',   flag: '🇧🇹' },
  { code: 'INR', symbol: '₹',   label: 'Indian Rupee',         flag: '🇮🇳' },
];

const SYMBOL_MAP = Object.fromEntries(CURRENCIES.map(c => [c.code, c.symbol]));

export function getCurrencySymbol(code) {
  return SYMBOL_MAP[code] || '$';
}

export function formatCurrency(amount, code = 'USD') {
  const symbol = getCurrencySymbol(code);
  const num = Number(amount || 0);
  return `${symbol}${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Persists currency code for the current session so any page can read it
export function saveCenterCurrency(code) {
  try { sessionStorage.setItem('eccd_currency', code || 'USD'); } catch (_) {}
}

export function getCenterCurrency() {
  try { return sessionStorage.getItem('eccd_currency') || 'USD'; } catch (_) { return 'USD'; }
}
