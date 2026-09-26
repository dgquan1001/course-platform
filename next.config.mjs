/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Mặc định Server Action chỉ nhận 1MB, cần tăng để upload ảnh chuyển khoản (tối đa 5MB)
    serverActions: { bodySizeLimit: '6mb' },
  },
}
export default nextConfig
