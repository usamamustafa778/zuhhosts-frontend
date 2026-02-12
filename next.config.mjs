/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "5001",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "zuhahosts-backend.onrender.com",
        pathname: "/uploads/**",
      },
    ],
    // Allow unoptimized images for development
    unoptimized: false,
  },
};

export default nextConfig;
