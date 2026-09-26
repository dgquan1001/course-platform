const isDev = process.env.NODE_ENV !== 'production'
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://*.supabase.co'
const supabaseWs = supabaseUrl.replace(/^http/, 'ws')

// Content Security Policy: chỉ cho tải tài nguyên từ website, Supabase (ảnh chuyển khoản, đăng nhập),
// VietQR (ảnh QR), YouTube/TikTok (video bài học) và Cloudflare Turnstile (chống bot).
// 'unsafe-inline' cho script vì Next.js chèn script nội tuyến; dev cần thêm 'unsafe-eval' (hot reload).
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://challenges.cloudflare.com`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${supabaseUrl} https://img.vietqr.io`,
  "font-src 'self' data:",
  `connect-src 'self' ${supabaseUrl} ${supabaseWs} https://challenges.cloudflare.com${isDev ? ' ws:' : ''}`,
  'frame-src https://www.youtube.com https://www.youtube-nocookie.com https://www.tiktok.com https://challenges.cloudflare.com',
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  // Chỉ có tác dụng khi chạy HTTPS (trình duyệt bỏ qua trên http://localhost)
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cho phép build vào thư mục riêng (VD kiểm thử E2E trong lúc `npm run dev` vẫn đang chạy trên .next)
  distDir: process.env.NEXT_DIST_DIR || '.next',
  poweredByHeader: false,
  experimental: {
    // Mặc định Server Action chỉ nhận 1MB, cần tăng để upload ảnh chuyển khoản (tối đa 5MB)
    serverActions: { bodySizeLimit: '6mb' },
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
}
export default nextConfig
