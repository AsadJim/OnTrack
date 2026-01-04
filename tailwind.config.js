/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // <--- এই লাইনটি অবশ্যই যোগ করবেন
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2C5F2D',
        beige: '#F5F5DC',
        charcoal: '#333333',
      }
    },
  },
  plugins: [],
}
