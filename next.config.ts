import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: {
    position: "bottom-right",
  },
  images: {
    formats: ["image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [190, 255, 300, 360, 400, 520],
    // Covers are already sized WebP files. Serve them directly so shop
    // and product pages do not wait on on-the-fly image conversion.
    unoptimized: true,
  },
};

export default nextConfig;
