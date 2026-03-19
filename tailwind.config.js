/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          ink: '#111315',
          panel: '#17191c',
          line: '#d7ddd6',
          mist: '#f3f5ef',
          soft: '#eef2ea',
          green: '#10a37f',
          greenDeep: '#0b7a60',
          greenGlow: '#dff6ee',
          danger: '#c95c54',
        },
      },
      boxShadow: {
        card: '0 18px 45px rgba(17, 19, 21, 0.08)',
        panel: '0 18px 60px rgba(17, 19, 21, 0.12)',
        glow: '0 0 0 1px rgba(16, 163, 127, 0.08), 0 18px 50px rgba(16, 163, 127, 0.12)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0)' },
          '50%': { transform: 'translate3d(0, -10px, 0)' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translate3d(0, 18px, 0)' },
          '100%': { opacity: '1', transform: 'translate3d(0, 0, 0)' },
        },
      },
      animation: {
        float: 'float 8s ease-in-out infinite',
        'fade-up': 'fadeUp 0.55s ease-out both',
      },
    },
  },
  plugins: [],
};
