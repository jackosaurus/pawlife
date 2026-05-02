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
        coral: '#E8806A',
        sage: '#8FA68A',
        'dusty-plum': '#6B4577',
        'brand-yellow': '#FDC602',
        'brand-yellow-pressed': '#E5B202',
        destructive: '#E5484D',
        card: '#FFFFFF',
        'text-primary': '#2D2A26',
        'text-secondary': '#7A756E',
        'status-green': '#5BA67C',
        'status-amber': '#E5A84B',
        'status-overdue': '#E8735A',
        'status-neutral': '#9CA3AF',
        'input-fill': '#F5F3F0',
        border: '#EDE8DF',
      },
      borderRadius: {
        card: '16px',
      },
      fontFamily: {
        // Display face — Fraunces, loaded via @expo-google-fonts/fraunces in
        // app/_layout.tsx. Use this only for the wordmark + hero headlines on
        // welcome / sign-in / sign-up. Body copy stays on the system sans.
        display: ['Fraunces_700Bold'],
        'display-regular': ['Fraunces_400Regular'],
      },
      fontSize: {
        display: ['36px', { lineHeight: '40px', fontWeight: '700' }],
        largeTitle: ['30px', { lineHeight: '36px', fontWeight: '700' }],
        title: ['22px', '28px'],
        headline: ['17px', { lineHeight: '22px', fontWeight: '600' }],
        body: ['17px', '24px'],
        callout: ['16px', '22px'],
        footnote: ['13px', '18px'],
        caption: ['12px', '16px'],
        'button-sm': ['15px', { lineHeight: '20px', fontWeight: '600' }],
        eyebrow: [
          '13px',
          { lineHeight: '16px', fontWeight: '600', letterSpacing: '0.5px' },
        ],
      },
    },
  },
  plugins: [],
};
