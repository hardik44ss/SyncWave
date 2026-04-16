/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        neon: {
          green: '#00ff41',
          dim: '#00aa44',
          dark: '#004400',
          darker: '#002200',
        },
        cyber: {
          black: '#000000',
          border: '#003300',
        },
      },
      fontFamily: {
        mono: ['Share Tech Mono', 'Courier New', 'monospace'],
      },
      boxShadow: {
        neon: '0 0 10px #00ff41, 0 0 20px #00ff4140',
        'neon-lg': '0 0 20px #00ff41, 0 0 40px #00ff4180',
      },
    },
  },
  plugins: [],
};
