import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Allow all HTTPS images — venue website scraper brings images from
      // arbitrary domains so we can't enumerate them all.
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
