/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // High-premium logistics color theme (Deep blues and Slate tones)
        primary: {
          50: '#f0f5ff',
          100: '#e5edff',
          200: '#cddbff',
          300: '#a4bdff',
          400: '#7395ff',
          500: '#3b66ff',
          600: '#2544eb',
          700: '#1d32d7',
          800: '#1828ae',
          900: '#1a2789',
          950: '#101653',
        },
        darkBg: '#0f172a', // Slate 900
        darkCard: '#1e293b', // Slate 800
        darkBorder: '#334155' // Slate 700
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'sans-serif']
      }
    }
  },
  plugins: []
};
