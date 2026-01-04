/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2C5F2D', // Deep Green
        beige: '#F5F5DC',   // Cream Background
        charcoal: '#333333',// Dark Text
      }
    },
  },
  plugins: [],
}
