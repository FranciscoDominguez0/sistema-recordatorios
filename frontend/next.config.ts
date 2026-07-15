import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.BACKEND_URL || "http://127.0.0.1:3000"}/:path*`, // Redirige /api/* a tu backend local o Docker
      },
    ];
  },
};

export default nextConfig;
