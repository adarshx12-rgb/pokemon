import type { NextConfig } from "next";
import { cardImagePatterns } from "./lib/tcg/imageAllowlist";

const isDev = process.env.NODE_ENV === "development";

// Static pages can't carry per-request nonces, so inline scripts stay allowed (Next's "without nonces" setup);
// every external origin is still allowlisted. Dev adds eval and the HMR websocket.
const csp = [
  "default-src 'self'",
  // Google Analytics, plus the Cloudflare Web Analytics beacon that Cloudflare injects at the edge.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://www.googletagmanager.com https://static.cloudflareinsights.com`,
  "style-src 'self' 'unsafe-inline'",
  // Card scans (pokemontcg.io), PokéAPI sprites (GitHub), and the Google Analytics pixel.
  "img-src 'self' data: blob: https://images.pokemontcg.io https://raw.githubusercontent.com https://*.google-analytics.com https://*.googletagmanager.com",
  "font-src 'self'",
  `connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://cloudflareinsights.com${isDev ? " ws:" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: { remotePatterns: cardImagePatterns() },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
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
