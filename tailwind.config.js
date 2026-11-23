/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          offwhite: '#F8F8F5',
          white: '#FFFFFF',
          black: '#111315',
          charcoal: '#202326',
          teal: '#1686A8',
          'teal-dark': '#0f637c',
          'teal-light': '#1e9fc5',
          ice: '#DCEEF3',
          'ice-light': '#EEF7F9',
          muted: '#8A9198',
          border: 'rgba(17, 19, 21, 0.08)',
          'border-dark': 'rgba(255, 255, 255, 0.1)',
        }
      },
      fontFamily: {
        heading: ['"Space Grotesk"', 'Sora', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        display: ['"Space Grotesk"', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 2px 10px rgba(17, 19, 21, 0.04)',
        'premium': '0 10px 30px -5px rgba(17, 19, 21, 0.08)',
        'glow': '0 0 25px rgba(22, 134, 168, 0.25)',
      },
      letterSpacing: {
        'tightest': '-0.035em',
        'widest-editorial': '0.2em',
      }
    },
  },
  plugins: [],
}
