/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        bangla: ['"Hind Siliguri"', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#10b981',
          600: '#059669', // Bangladesh Emerald Green
          700: '#047857',
        },
        accent: {
          500: '#f43f5e', // Vibrant Accent / Red
          600: '#e11d48',
        }
      }
    },
  },
  plugins: [],
}
