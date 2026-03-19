/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          cyan: '#05d9e8',
          green: '#3dfc89',
          purple: '#bc13fe',
          pink: '#ff005a'
        }
      },
      boxShadow: {
        'neon-cyan': '0 0 10px #05d9e8, 0 0 20px #05d9e8, 0 0 30px #05d9e8',
        'neon-green': '0 0 10px #3dfc89, 0 0 20px #3dfc89, 0 0 30px #3dfc89',
        'neon-purple': '0 0 10px #bc13fe, 0 0 20px #bc13fe, 0 0 30px #bc13fe',
        'neon-pink': '0 0 10px #ff005a, 0 0 20px #ff005a, 0 0 30px #ff005a'
      }
    }
  },
  plugins: []
};