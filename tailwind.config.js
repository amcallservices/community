/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: '#181715',
        card: '#26241f',
        card2: '#33312b',
        paper: '#f3f2ec',
        newsprint: '#e8e8e3',
        surface: '#dcdcd6',
        brass: '#bfb21a',
        navy: '#0f172a',
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
