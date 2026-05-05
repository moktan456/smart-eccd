// Theme palettes for SMART ECCD
// Each palette maps to Tailwind's primary color scale

export const THEME_PALETTES = {
  default: {
    50:  '#eef2ff',
    100: '#e0e7ff',
    500: '#6366f1',
    600: '#4F46E5',
    700: '#4338CA',
  },
  ocean: {
    50:  '#f0f9ff',
    100: '#e0f2fe',
    500: '#38bdf8',
    600: '#0EA5E9',
    700: '#0284C7',
  },
  forest: {
    50:  '#f0fdf4',
    100: '#dcfce7',
    500: '#4ade80',
    600: '#16A34A',
    700: '#15803D',
  },
  sunset: {
    50:  '#fff7ed',
    100: '#ffedd5',
    500: '#fb923c',
    600: '#EA580C',
    700: '#C2410C',
  },
  rose: {
    50:  '#fff1f2',
    100: '#ffe4e6',
    500: '#fb7185',
    600: '#E11D48',
    700: '#BE123C',
  },
};

/**
 * Given a theme name and optional custom hex color, return the palette to apply.
 * Falls back to default if theme name is unknown.
 */
export function resolvePalette(themeName, themeColor) {
  if (THEME_PALETTES[themeName]) return THEME_PALETTES[themeName];
  if (themeColor) {
    return {
      50:  themeColor + '15',
      100: themeColor + '30',
      500: themeColor,
      600: themeColor,
      700: themeColor,
    };
  }
  return THEME_PALETTES.default;
}

/**
 * Apply a theme palette to the document root via CSS custom properties.
 */
export function applyTheme(themeName, themeColor) {
  const palette = resolvePalette(themeName, themeColor);
  const root = document.documentElement;
  root.style.setProperty('--color-primary-50',  palette[50]);
  root.style.setProperty('--color-primary-100', palette[100]);
  root.style.setProperty('--color-primary-500', palette[500]);
  root.style.setProperty('--color-primary-600', palette[600]);
  root.style.setProperty('--color-primary-700', palette[700]);
}
