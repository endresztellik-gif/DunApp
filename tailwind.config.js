/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Module Primary Colors
        meteorology: {
          DEFAULT: '#00A8CC',
          light: '#E0F7FA',
          dark: '#006064',
        },
        water: {
          DEFAULT: '#00BCD4',
          light: '#B2EBF2',
          dark: '#00838F',
        },
        drought: {
          DEFAULT: '#FF9800',
          light: '#FFE0B2',
          dark: '#E65100',
          beige: '#FFF8DC',
          // Drought map legend colors
          none: '#90EE90',
          mild: '#FFFFE0',
          moderate: '#FFD700',
          severe: '#FFA500',
          extreme: '#FF4500',
        },
        // Background Colors
        'bg-main': '#F0F4F8',
        'bg-card': '#FFFFFF',
        'bg-hover': '#E8F4F8',
        // Text Colors
        'text-primary': '#2C3E50',
        'text-secondary': '#607D8B',
        'text-light': '#90A4AE',
        // Border
        'border-light': '#E0E7ED',
        // Chart Colors
        chart: {
          cyan: '#00BCD4',
          teal: '#00897B',
          green: '#43A047',
          blue: '#1E88E5',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        xs: '12px',
        sm: '14px',
        base: '16px',
        lg: '18px',
        xl: '24px',
        '2xl': '32px',
        '3xl': '48px',
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '8px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
      boxShadow: {
        sm: '0 2px 4px rgba(0, 0, 0, 0.05)',
        DEFAULT: '0 4px 8px rgba(0, 0, 0, 0.1)',
        md: '0 4px 8px rgba(0, 0, 0, 0.1)',
        lg: '0 8px 16px rgba(0, 0, 0, 0.12)',
      },
      spacing: {
        'container-padding': '24px',
        'module-spacing': '24px',
        'card-padding': '20px',
        'card-gap': '16px',
      },
      maxWidth: {
        container: '1280px',
      },
      minHeight: {
        'card': '140px',
      },
      height: {
        'map-desktop': '400px',
        'map-mobile': '300px',
        'chart-standard': '350px',
        'chart-mobile': '250px',
        'chart-comparison': '400px',
      },
      zIndex: {
        base: '0',
        dropdown: '10',
        sticky: '20',
        modal: '30',
        toast: '40',
      },
      transitionDuration: {
        fast: '150ms',
        normal: '200ms',
        slow: '300ms',
      },
      // Responsive breakpoints (Tailwind defaults, explicitly defined for clarity)
      screens: {
        sm: '640px',   // Mobile landscape / small tablets
        md: '768px',   // Tablets
        lg: '1024px',  // Desktops
        xl: '1280px',  // Large desktops
        '2xl': '1536px', // Extra large desktops
      },
    },
  },
  plugins: [],
}
