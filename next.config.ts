import withBundleAnalyzer from "@next/bundle-analyzer"
import { type NextConfig } from "next"

import { env } from "./env.mjs"

const config: NextConfig = {
  allowedDevOrigins: ["http://127.0.0.1:3000", "http://127.0.0.1:59435"],
  reactStrictMode: true,
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  rewrites: async () => [
    { source: "/healthz", destination: "/api/health" },
    {
      source: "/api/healthz",
      destination: "/api/health",
    },
    { source: "/health", destination: "/api/health" },
    { source: "/ping", destination: "/api/health" },
  ],
  serverExternalPackages: ["@volcengine/openapi"],
}

export default env.ANALYZE ? withBundleAnalyzer({ enabled: env.ANALYZE })(config) : config
