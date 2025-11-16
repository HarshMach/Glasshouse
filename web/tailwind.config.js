/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
    './lib/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        glass: {
          bg: '#050816',
          card: '#0b1020',
          accent: '#38bdf8',
        },
      },
    },
  },
  plugins: [],
};
