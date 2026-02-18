/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f7ff',
          100: '#e0efff',
          500: '#667eea',
          600: '#5568d3',
          700: '#4751b8',
        }
      }
    },
  },
  plugins: [],
}


