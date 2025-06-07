/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com", // Avatar hoặc ảnh user từ Google
      },
      {
        protocol: "https",
        hostname: "drive.google.com", // Cho phép load ảnh từ Google Drive
      },
    ],
  },
  env: {
    GOOGLE_APPLICATION_CREDENTIALS: "serviceAccountKey.json",
  },
  // experimental: {}, // hoặc bỏ nếu không dùng
};

module.exports = nextConfig;
