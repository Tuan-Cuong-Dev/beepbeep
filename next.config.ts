/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Google Drive (uc?export=view&id=...)
      { protocol: 'https', hostname: 'drive.google.com', pathname: '/**' },
      // Một số file Drive trả qua domain usercontent
      { protocol: 'https', hostname: 'drive.usercontent.google.com', pathname: '/**' },

      // Google Photos / avatar / ảnh Drive redirect về lh3...
      { protocol: 'https', hostname: 'lh3.googleusercontent.com', pathname: '/**' },
      // (tuỳ dự án, nếu bạn thấy ảnh từ lh4/lh5, thêm vào)
      // { protocol: 'https', hostname: 'lh4.googleusercontent.com', pathname: '/**' },
      // { protocol: 'https', hostname: 'lh5.googleusercontent.com', pathname: '/**' },

      // Avatar demo
      { protocol: 'https', hostname: 'i.pravatar.cc', pathname: '/**' },
       // thêm khi thấy cần:
    { protocol: 'https', hostname: 'lh4.googleusercontent.com', pathname: '/**' },
    { protocol: 'https', hostname: 'lh5.googleusercontent.com', pathname: '/**' },
    ],
  },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
}

module.exports = nextConfig
