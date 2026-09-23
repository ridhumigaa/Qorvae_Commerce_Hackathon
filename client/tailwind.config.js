/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        oracle: {
          red: '#F80000',
          dark: '#161513',
          gray: '#312D2A',
          cream: '#F7F6F3'
        }
      }
    },
  },
  plugins: [],
}
