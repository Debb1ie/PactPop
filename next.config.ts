import type { NextConfig } from "next";

// cacheComponents is intentionally OFF: every business view is per-tenant, live financial data
// and must render per request (see docs/DECISIONS.md #11).
const nextConfig: NextConfig = {
  serverExternalPackages: ["@electric-sql/pglite", "pg", "bcryptjs"],
  poweredByHeader: false,
  // Dev-only Next.js badge overlaps the top-bar user menu; hide it.
  devIndicators: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
