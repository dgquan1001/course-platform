import type { Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Xanh nước biển dịu: màu chủ đạo, tạo cảm giác tin cậy (y tế)
        ocean: {
          50: '#F3F8FC',
          100: '#E4F0F9',
          200: '#C9E1F2',
          300: '#A0CAE7',
          400: '#6EACD6',
          500: '#4A91C4',
          600: '#3777AA',
          700: '#2E608B',
          800: '#294F71',
          900: '#24425D',
          950: '#172A3D',
        },
        // Vàng kem: màu nhấn nhẹ nhàng cho nút đăng ký, giá
        gold: {
          50: '#FFFDF6',
          100: '#FEF8E6',
          200: '#FCEFC6',
          300: '#F8E09A',
          400: '#F3CE6D',
          500: '#E8B84B',
          600: '#CC9636',
          700: '#A7752E',
          800: '#865D2B',
          900: '#6E4D27',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', ...defaultTheme.fontFamily.sans],
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.4s ease-out both',
      },
    },
  },
  plugins: [],
}
export default config
