/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          light: '#4FC3F7',
          DEFAULT: '#14A8E9',
          dark: '#0288D1',
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
    animation: {
      blob: "blob 10s infinite",
      float: "float 20s ease-in-out infinite",
      floatReverse: "float 25s ease-in-out infinite reverse",
      scanLine: "scanLine 8s linear infinite",
    },
    keyframes: {
      blob: {
        "0%": { transform: "translate(0px, 0px) scale(1)" },
        "33%": { transform: "translate(30px, -50px) scale(1.1)" },
        "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
        "100%": { transform: "translate(0px, 0px) scale(1)" },
      },
      float: {
        "0%, 100%": { transform: "translateY(0) translateX(0)" },
        "50%": { transform: "translateY(-100px) translateX(50px)" },
      },
      scanLine: {
        "0%": { transform: "translateY(-100%)", opacity: "0" },
        "10%": { opacity: "1" },
        "90%": { opacity: "1" },
        "100%": { transform: "translateY(100vh)", opacity: "0" },
      }
    }
  },
  plugins: [],
};
