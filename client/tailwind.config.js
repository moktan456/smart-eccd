/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // SMART ECCD Brand — driven by CSS custom properties set at runtime
        primary: {
          50:  'var(--color-primary-50)',
          100: 'var(--color-primary-100)',
          500: 'var(--color-primary-500)',
          600: 'var(--color-primary-600)',
          700: 'var(--color-primary-700)',
        },
        // Bloom's Taxonomy Colors
        bloom: {
          remember:   '#E74C3C',
          understand: '#E67E22',
          apply:      '#F1C40F',
          analyze:    '#27AE60',
          evaluate:   '#2980B9',
          create:     '#8E44AD',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
      },
    },
  },
  plugins: [],
};
