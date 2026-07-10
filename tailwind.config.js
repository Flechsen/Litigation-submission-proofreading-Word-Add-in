/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#15202B',
        paper: '#FBFAF7',
        mist: '#F4F5F7',
        hairline: '#E3E6EA',
        muted: '#6B7280',
        faint: '#9AA3AF',
        brass: {
          DEFAULT: '#B0822A',
          soft: '#C79A3E',
          deep: '#8A6420',
          wash: '#F6EEDC',
        },
        accept: '#1E7A4D',
        reject: '#C0392B',
      },
      fontFamily: {
        serif: ['"Source Serif 4"', 'Georgia', 'Cambria', 'serif'],
        ui: ['"Segoe UI"', 'system-ui', '-apple-system', 'Roboto', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(21,32,43,0.05)',
      },
    },
  },
  plugins: [],
}
