/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#2563eb', // Electric Blue
          dark: '#1e40af',
          light: '#60a5fa',
          bg: '#050505',      // Void Black
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  safelist: [
    {
      pattern: /^(bg|text|border)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-[0-9]{1,3}$/,
      variants: ['hover', 'focus'],
    },
    'w-full', 'h-2', 'h-full', 'w-screen' // Explicitly safe common layout utils
  ],
  plugins: [],
}