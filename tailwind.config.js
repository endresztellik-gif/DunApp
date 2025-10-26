/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Module colors
        meteorology: '#00A8CC',
        'water-level': '#00BCD4',
        drought: '#FF9800',
        // Background colors
        'bg-main': '#F0F4F8',
        'bg-card': '#FFFFFF',
        // Text colors
        'text-primary': '#2C3E50',
        'text-secondary': '#607D8B',
      },
    },
  },
  plugins: [],
}
