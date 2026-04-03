/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          light: '#8B85FF',
          DEFAULT: '#6C63FF',
          dark: '#5B54E0',
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
