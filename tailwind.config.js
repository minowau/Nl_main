/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          light: '#027baeff',
          DEFAULT: '#0575a9ff',
          dark: '#015483ff',
        },
        secondary: '#0e95cfff', // Soft Blue
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
