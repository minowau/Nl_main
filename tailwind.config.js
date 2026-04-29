/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          light: '#38bdf8',
          DEFAULT: '#0ea5e9',
          dark: '#0284c7',
        },
        secondary: '#38BDF8', // Soft Blue
        surface: {
          light: '#F8F9FA',
          DEFAULT: '#FFFFFF',
          dark: '#E9ECEF',
        }
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
