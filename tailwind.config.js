/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1b1464',
        card: '#2a1f7a',
        card2: '#3a2d96',
        paper: '#fffaf0',
        newsprint: '#eceff6',
        surface: '#d6dce9',
        brass: '#ffc83d',
        navy: '#1b1464',
        ivory: '#fffaf0',
        ivory2: '#f1ecff',
        line: '#e4defa',
        golddark: '#4b2fd6',
        wine: '#5b3df5',
        coral: '#ff6b6b',
        mint: '#2dd4a7',
        gold: '#ffc83d',
      },
      fontFamily: {
        sans: ['"Literata Variable"', 'Georgia', 'serif'],
        serif: ['"Literata Variable"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
