/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cho phép build vào thư mục riêng (VD kiểm thử E2E trong lúc `npm run dev` vẫn đang chạy trên .next)
  distDir: process.env.NEXT_DIST_DIR || '.next',
  experimental: {
    // Mặc định Server Action chỉ nhận 1MB, cần tăng để upload ảnh chuyển khoản (tối đa 5MB)
    serverActions: { bodySizeLimit: '6mb' },
  },
}
export default nextConfig
