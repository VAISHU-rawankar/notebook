/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        handwriting: ['Caveat', 'cursive'],
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        card:       '#F6E27F',
        'card-dim': '#EDD060',
        bg:         '#EEEADB',
        ink:        '#5C4A1E',
        'ink-mid':  '#7A6B30',
        'ink-lt':   '#9A8A50',
        'ink-ghost':'#C0AE70',
      },
      borderRadius: { card: '16px' },
      boxShadow: {
        card:    '0 2px 14px rgba(92,74,30,0.11)',
        'card-lg':'0 6px 32px rgba(92,74,30,0.18)',
        float:   '0 4px 18px rgba(92,74,30,0.22)',
      },
    },
  },
  plugins: [],
};
