// SMART ECCD – Theme System
// 5 professionally designed themes + custom color support

// ── Palette definitions ─────────────────────────────────────────────────────

export const THEMES = [
  {
    value:       'sneat',
    label:       'Sneat',
    tagline:     'Soft lavender · modern',
    color:       '#696CFF',
    palette: {
      50:  '#F0EEFF',
      100: '#DDDAFE',
      500: '#8D91FF',
      600: '#696CFF',
      700: '#4E51E6',
    },
  },
  {
    value:       'materio',
    label:       'Materio',
    tagline:     'Deep purple · material',
    color:       '#9155FD',
    palette: {
      50:  '#F4EEFF',
      100: '#E0CFFF',
      500: '#B47FFF',
      600: '#9155FD',
      700: '#6D35D0',
    },
  },
  {
    value:       'breeze',
    label:       'Breeze',
    tagline:     'Azure blue · clean',
    color:       '#3699FF',
    palette: {
      50:  '#E8F3FF',
      100: '#C9E2FF',
      500: '#74B8FF',
      600: '#3699FF',
      700: '#1A7FE5',
    },
  },
  {
    value:       'sage',
    label:       'Sage',
    tagline:     'Teal green · calm',
    color:       '#00BFA5',
    palette: {
      50:  '#E0F5F2',
      100: '#B2EBE0',
      500: '#26C6B3',
      600: '#00BFA5',
      700: '#00897B',
    },
  },
  {
    value:       'ember',
    label:       'Ember',
    tagline:     'Warm amber · vibrant',
    color:       '#FF6B35',
    palette: {
      50:  '#FFF3EE',
      100: '#FFE0D0',
      500: '#FF9169',
      600: '#FF6B35',
      700: '#E5521C',
    },
  },
];

// Lookup by value — O(1)
const PALETTE_MAP = Object.fromEntries(THEMES.map(t => [t.value, t.palette]));

// ── Custom color palette generator ──────────────────────────────────────────

function hexToHsl(hex) {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s;
  const l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      default: h = ((r - g) / d + 4) / 6;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function generateCustomPalette(hex) {
  if (!hex || hex.length < 7) return PALETTE_MAP.sneat;
  const [h, s, l] = hexToHsl(hex);
  return {
    50:  hslToHex(h, Math.max(s - 10, 20), 96),
    100: hslToHex(h, Math.max(s - 5,  25), 90),
    500: hslToHex(h, s, Math.min(l + 12, 72)),
    600: hex,
    700: hslToHex(h, Math.min(s + 5, 100), Math.max(l - 12, 15)),
  };
}

// ── Public API ───────────────────────────────────────────────────────────────

export function resolvePalette(themeName, themeColor) {
  if (PALETTE_MAP[themeName]) return PALETTE_MAP[themeName];
  if (themeColor && themeColor.startsWith('#') && themeColor.length >= 7) {
    return generateCustomPalette(themeColor);
  }
  return PALETTE_MAP.sneat;
}

export function applyTheme(themeName, themeColor) {
  const palette = resolvePalette(themeName, themeColor);
  const root = document.documentElement;
  root.style.setProperty('--color-primary-50',  palette[50]);
  root.style.setProperty('--color-primary-100', palette[100]);
  root.style.setProperty('--color-primary-500', palette[500]);
  root.style.setProperty('--color-primary-600', palette[600]);
  root.style.setProperty('--color-primary-700', palette[700]);
  try {
    localStorage.setItem('smart-eccd-theme', JSON.stringify({ themeName, themeColor }));
  } catch (_) {}
}

export function restoreTheme() {
  try {
    const saved = localStorage.getItem('smart-eccd-theme');
    if (saved) {
      const { themeName, themeColor } = JSON.parse(saved);
      const palette = resolvePalette(themeName, themeColor);
      const root = document.documentElement;
      root.style.setProperty('--color-primary-50',  palette[50]);
      root.style.setProperty('--color-primary-100', palette[100]);
      root.style.setProperty('--color-primary-500', palette[500]);
      root.style.setProperty('--color-primary-600', palette[600]);
      root.style.setProperty('--color-primary-700', palette[700]);
    }
  } catch (_) {}
}

// Default palette (used in index.css :root vars as baseline)
export const DEFAULT_PALETTE = PALETTE_MAP.sneat;
