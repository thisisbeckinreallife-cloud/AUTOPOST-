import createNextIntlPlugin from "next-intl/plugin";

// next-intl plugin: apunta a /src/i18n/request.ts.
// Las páginas Server Components usan getTranslations(namespace), las
// Client Components usan useTranslations dentro de NextIntlClientProvider.
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output standalone: bundle solo deps usadas por archivo → container 5-10×
  // más pequeño. Necesario porque Railway image push se atascaba con el
  // bundle completo de node_modules (~1GB con three.js + Together + AWS).
  output: "standalone",
  experimental: {
    instrumentationHook: true,
    serverComponentsExternalPackages: [
      "bullmq",
      "ioredis",
      "jszip",
      "sharp",
      "together-ai", // SDK pesado con deps opcionales (parquetjs) que no usamos
    ],
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
  webpack(config, { isServer }) {
    config.ignoreWarnings = [
      ...(config.ignoreWarnings ?? []),
      {
        module: /node_modules\/@react-three\/drei/,
        message: /sRGBEncoding/,
      },
    ];
    // Together SDK declara `parquetjs` como opcional (sólo para fine-tuning)
    // pero webpack lo trata como required. Lo marcamos como no-op.
    if (isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        parquetjs: false,
      };
    }
    return config;
  },
  // Redirects 301: las URLs viejas de preview rutas → /lab/*
  // Mover a /lab/* fue parte del Bloque A del rediseño (Mayo 2026):
  // estas rutas no convierten al usuario y no deben indexarse.
  async redirects() {
    return [
      { source: "/demo",                    destination: "/lab/demo",                    permanent: true },
      { source: "/demo/:path*",             destination: "/lab/demo/:path*",             permanent: true },
      { source: "/editorial",               destination: "/lab/editorial",               permanent: true },
      { source: "/editorial/:path*",        destination: "/lab/editorial/:path*",        permanent: true },
      { source: "/hero-preview",            destination: "/lab/hero-preview",            permanent: true },
      { source: "/hero-preview/:path*",     destination: "/lab/hero-preview/:path*",     permanent: true },
      { source: "/palette-preview",         destination: "/lab/palette-preview",         permanent: true },
      { source: "/palette-preview/:path*",  destination: "/lab/palette-preview/:path*",  permanent: true },
      { source: "/brand-lab",               destination: "/lab/brand-lab",               permanent: true },
      { source: "/brand-lab/:path*",        destination: "/lab/brand-lab/:path*",        permanent: true },
      { source: "/comparar/:competidor",    destination: "/lab/comparar/:competidor",    permanent: true },
    ];
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

export default withNextIntl(nextConfig);
