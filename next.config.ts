import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { remotePatterns: [{ protocol: "https", hostname: "images.pokemontcg.io" }] },
  async redirects() {
    // One canonical host: www.pokefame.com → pokefame.com.
    return [{ source: "/:path*", has: [{ type: "host", value: "www.pokefame.com" }], destination: "https://pokefame.com/:path*", permanent: true }];
  },
  turbopack: {
    rules: {
      "*.css": {
        // CSS modules must keep their own pipeline (local class names), so only global CSS goes through Tailwind.
        condition: { not: { path: /\.module\.css$/ } },
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
