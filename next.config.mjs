/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    instrumentationHook: true,
    serverComponentsExternalPackages: ["bullmq", "ioredis", "jszip", "sharp"],
    // Allow large request bodies for ZIP uploads (default is ~4.5MB)
    serverActions: {
      bodySizeLimit: "100mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  // Suppress @react-three/drei warning about deprecated sRGBEncoding (removed
  // in three ≥150). Drei v9 still imports the symbol; harmless for our use.
  webpack(config) {
    config.ignoreWarnings = [
      ...(config.ignoreWarnings ?? []),
      {
        module: /node_modules\/@react-three\/drei/,
        message: /sRGBEncoding/,
      },
    ];
    return config;
  },
  // Security + cache headers
  async headers() {
    return [
      {
        // Defaults: security + 60s edge cache para HTML con SWR.
        // Antes: Railway+Fastly cacheaba HTML 1 año via s-maxage=31536000 — bug
        // que bloqueaba propagación de deploys.
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Cache-Control",
            value: "public, max-age=0, s-maxage=60, stale-while-revalidate=600",
          },
        ],
      },
      {
        // Assets de Next con hash en el nombre — cache largo seguro.
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Imágenes optimizadas — cache moderado.
        source: "/_next/image(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000",
          },
        ],
      },
      {
        // API: nunca cachear.
        source: "/api/(.*)",
        headers: [
          { key: "Cache-Control", value: "private, no-store, max-age=0" },
        ],
      },
    ];
  },
};

export default nextConfig;
