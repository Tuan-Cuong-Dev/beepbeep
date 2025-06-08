/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "drive.google.com",
      },
    ],
  },
 eslint: {
    ignoreDuringBuilds: true, // ⚠️ Bỏ qua lỗi eslint khi build
  },
  typescript: {
    ignoreBuildErrors: true,  // ⚠️ Bỏ qua lỗi TypeScript khi build
  },
};

module.exports = nextConfig;
