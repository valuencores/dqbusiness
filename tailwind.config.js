/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#040d21',
          900: '#0a1628',
          800: '#0f2040',
          700: '#162a52',
          600: '#1e3a6e',
          500: '#2a4f8a',
        },
        gold: {
          500: '#c9a84c',
          400: '#d4b56a',
          300: '#e0c98a',
          200: '#ecddb0',
          100: '#f7f0d8',
        },
        charcoal: {
          900: '#1a1a2e',
          800: '#16213e',
          700: '#1f2b47',
          600: '#2d3748',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
