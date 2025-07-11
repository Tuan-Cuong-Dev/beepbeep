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
      {
        protocol: "https",
        hostname: "drive.usercontent.google.com", // 👈 thêm dòng này
      },
      {
      protocol: "https",
      hostname: "lh3.googleusercontent.com", // ảnh từ Google Photos hoặc Avatar
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc", // 👈 Thêm dòng này để ảnh avatar giả hoạt động
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
