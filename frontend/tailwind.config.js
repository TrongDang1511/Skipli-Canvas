/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['"Newsreader"', 'Lora', 'Georgia', 'serif'],
      },
      colors: {
        // Theme Tông Sáng Sang Trọng (Skipli Canvas)
        navy: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#627d98',
          600: '#486581',
          700: '#334e68',
          800: '#1e3e62',
          900: '#0b192c',
          950: '#060d17',
        },
        gold: {
          50: '#fbf8ee',
          100: '#f4edcf',
          200: '#ebdca0',
          300: '#e1c66c',
          400: '#d4af37', // Metallic Gold chuẩn
          500: '#c59e2b',
          600: '#aa7e22',
          700: '#875d1d',
          800: '#6f4a1c',
          900: '#5c3d1b',
        },
        beige: {
          50: '#faf9f6',  // Warm White nền chính
          100: '#f5f4ef',
          200: '#ebe9df',
          300: '#ddd9cb',
          400: '#c9c2b0',
          500: '#b2a893',
        }
      }
    },
  },
  plugins: [],
}
