/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0b1630',
        card: '#14213f',
        card2: '#1f2f55',
        paper: '#f7f3e8',
        newsprint: '#eceff6',
        surface: '#d6dce9',
        brass: '#d4a437',
        navy: '#0b1630',
        ivory: '#f6f4ee',
        ivory2: '#ebe7dc',
        line: '#e0dccf',
        golddark: '#8a5d00',
        gold: '#f59e0b',
      },
      fontFamily: {
        sans: ['"Literata Variable"', 'Georgia', 'serif'],
        serif: ['"Literata Variable"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
