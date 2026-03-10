/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#FFF8E7',
        primary: {
          DEFAULT: '#4A2157',
          pressed: '#341539',
        },
        accent: '#E8735A',
        card: '#FFFFFF',
        'text-primary': '#2D2A26',
        'text-secondary': '#7A756E',
        'status-green': '#5BA67C',
        'status-amber': '#E5A84B',
        'status-overdue': '#E8735A',
        border: '#EDE8DF',
      },
      borderRadius: {
        card: '16px',
      },
    },
  },
  plugins: [],
};
