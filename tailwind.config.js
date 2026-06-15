/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Surfaces
        'bg-base': 'var(--bg-base)',
        'bg-surface': 'var(--bg-surface)',
        'bg-raised': 'var(--bg-raised)',
        'bg-hover': 'var(--bg-hover)',
        'bg-overlay': 'var(--bg-overlay)',
        // Borders
        'border-dim': 'var(--border-dim)',
        'border-subtle': 'var(--border-subtle)',
        'border-default': 'var(--border-default)',
        'border-strong': 'var(--border-strong)',
        // Text
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        // Brand
        'blue-400': 'var(--blue-400)',
        'blue-300': 'var(--blue-300)',
        'gain': 'var(--gain-500)',
        'gain-400': 'var(--gain-400)',
        'loss': 'var(--loss-500)',
        'loss-400': 'var(--loss-400)',
        'warn': 'var(--warn-500)',
        'warn-400': 'var(--warn-400)',
        'ai-accent': 'var(--ai-accent)',
        // Chart
        'chart-1': 'var(--chart-1)',
        'chart-2': 'var(--chart-2)',
        'chart-3': 'var(--chart-3)',
        'chart-4': 'var(--chart-4)',
        'chart-5': 'var(--chart-5)',
        'chart-6': 'var(--chart-6)',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1.4' }],
      },
      borderRadius: {
        xs: 'var(--radius-xs)',
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        'glow-brand': 'var(--glow-brand)',
        'glow-brand-sm': 'var(--glow-brand-sm)',
        'glow-gain': 'var(--glow-gain)',
        'glow-loss': 'var(--glow-loss)',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      width: {
        sidebar: 'var(--sidebar-width)',
        panel: 'var(--panel-width)',
      },
      height: {
        topbar: 'var(--topbar-height)',
      },
    },
  },
  plugins: [],
}
