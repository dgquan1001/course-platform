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
        // Chỉ trồi lên (không mờ dần) – cho khối là phần tử LCP (thẻ đăng nhập) – PERF-09
        rise: {
          '0%': { transform: 'translateY(10px)' },
          '100%': { transform: 'translateY(0)' },
        },
        // Trang chủ: thẻ nổi bồng bềnh, nền loang chuyển động, dải chuyên môn chạy ngang
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        blob: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(30px, -40px) scale(1.08)' },
          '66%': { transform: 'translate(-25px, 20px) scale(0.95)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        // Đợt 20: chữ tiêu đề hero hiện từng từ (mờ → rõ, trồi lên)
        // PERF-09 (Đợt 22): không bắt đầu từ opacity 0 – tiêu đề hero là phần tử LCP, chữ mờ (blur) vẫn tính là đã hiện
        // nên LCP = lúc vẽ đầu tiên thay vì chờ hết hiệu ứng (đo trước: 89% LCP là "render delay")
        'word-in': {
          '0%': { transform: 'translateY(0.45em) rotate(2deg)', filter: 'blur(12px)' },
          '100%': { transform: 'translateY(0) rotate(0)', filter: 'blur(0)' },
        },
        'scroll-cue': {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '70%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '0' },
        },
        glow: {
          '0%, 100%': { opacity: '0.55', transform: 'scale(1)' },
          '50%': { opacity: '0.9', transform: 'scale(1.06)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.4s ease-out both',
        rise: 'rise 0.5s cubic-bezier(0.2, 0.7, 0.2, 1) both',
        'fade-up-slow': 'fade-up 0.8s cubic-bezier(0.2, 0.7, 0.2, 1) both',
        float: 'float 6s ease-in-out infinite',
        blob: 'blob 18s ease-in-out infinite',
        marquee: 'marquee 40s linear infinite',
        'marquee-reverse': 'marquee 48s linear infinite reverse',
        'word-in': 'word-in 0.9s cubic-bezier(0.2, 0.7, 0.2, 1) both',
        'scroll-cue': 'scroll-cue 1.8s ease-in-out infinite',
        'spin-slow': 'spin 14s linear infinite',
        glow: 'glow 5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
export default config
