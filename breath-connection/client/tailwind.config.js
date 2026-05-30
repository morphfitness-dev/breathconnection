/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        teal: {
          primary: '#0D5C63',
          light: '#1A7A83',
          dark: '#094349',
        },
        amber: {
          accent: '#E8A87C',
          light: '#F0C4A0',
          dark: '#D4885A',
        },
        offwhite: '#FAF8F5',
      },
      fontFamily: {
        serif: ['"DM Serif Display"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
