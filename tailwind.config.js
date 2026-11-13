/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: '#3a1420',
        card: '#4a1d2a',
        card2: '#5a2a38',
        paper: '#fbf5ee',
        newsprint: '#eceff6',
        surface: '#d6dce9',
        brass: '#e8b4a0',
        navy: '#3a1420',
        ivory: '#fbf5ee',
        ivory2: '#f3e6dc',
        line: '#e6d9cc',
        golddark: '#8c2f39',
        wine: '#8c2f39',
        gold: '#e8b4a0',
      },
      fontFamily: {
        sans: ['"Literata Variable"', 'Georgia', 'serif'],
        serif: ['"Literata Variable"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
