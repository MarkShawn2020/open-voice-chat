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

  serverExternalPackages: [
    // 火山sdk用到了wasm，必须隔离在nodejs环境里，否则会报错
    "@volcengine/openapi"
  ],
}

export default env.ANALYZE ? withBundleAnalyzer({ enabled: env.ANALYZE })(config) : config
