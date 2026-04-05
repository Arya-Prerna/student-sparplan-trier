import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "mg2de.b-cdn.net",
        pathname: "/api/v1/offers/**",
      },
    ],
  },
};

export default nextConfig;
