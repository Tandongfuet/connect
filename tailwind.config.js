/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./contexts/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: { light: '#A5D6A7', DEFAULT: '#4CAF50', dark: '#388E3C' },
        secondary: { DEFAULT: '#F5F5DC' },
        accent: { DEFAULT: '#FFEB3B' },
        dark: { bg: '#121212', surface: '#1E1E1E', border: '#2C2C2C', text: '#E0E0E0', muted: '#9E9E9E' },
        'slate-dark': '#2E2E2E',
        'gray-muted': '#757575',
        'cream-light': '#FAFAF0'
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'pop-in': 'popIn 0.3s ease-out',
        'pulse-subtle': 'pulse-subtle 2s infinite'
      },
      keyframes: {
        fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        fadeInUp: { '0%': { opacity: 0, transform: 'translateY(20px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        popIn: { '0%': { opacity: 0, transform: 'scale(0.95)' }, '100%': { opacity: 1, transform: 'scale(1)' } },
        'pulse-subtle': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.7 } }
      }
    },
  },
  plugins: [],
}