import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0F1410',
        surface: '#171D17',
        'surface-2': '#1F2620',
        line: 'rgba(255,255,255,0.08)',
        'line-2': 'rgba(255,255,255,0.14)',
        fg: '#F2F4EF',
        'fg-2': '#A8B0A4',
        'fg-3': '#6B746A',
        accent: '#C8FF3D',
        'accent-ink': '#0B1208',
        'accent-press': '#9CCC1C',
        warn: '#FFB02E',
        err: '#FF5C5C',
        'err-fg': '#FF8E8E',
        ok: '#7DE08D',
        'ok-fg': '#A6EDB1',
        info: '#7AC7FF',
        'info-fg': '#A8D9FF',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'sans-serif'],
        display: ['Geist', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', '"SF Mono"', 'Menlo', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.04em',
        tighter2: '-0.03em',
        eyebrow: '0.14em',
      },
    },
  },
  plugins: [],
} satisfies Config;
