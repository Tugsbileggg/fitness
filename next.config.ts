import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Лого (≤2MB) + multipart overhead.
      bodySizeLimit: "3mb",
    },
  },
};

export default nextConfig;
