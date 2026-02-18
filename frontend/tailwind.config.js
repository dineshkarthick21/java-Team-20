/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2874f0',
        success: '#26a541',
        danger: '#ef4444',
      },
    },
  },
  plugins: [],
}
