import type { MetadataRoute } from "next";

const SITE_URL = "https://autopost-production-cd57.up.railway.app";

/**
 * Sitemap.xml — solo URLs públicas + indexables.
 * /lab/*, /(admin)/, /onboarding/*, /api/* ya están bloqueados en
 * public/robots.txt. Aquí no se listan.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const today = new Date();

  return [
    {
      url: `${SITE_URL}/`,
      lastModified: today,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/signup`,
      lastModified: today,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/login`,
      lastModified: today,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/forgot-password`,
      lastModified: today,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/legal/privacy`,
      lastModified: today,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/legal/terms`,
      lastModified: today,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/legal/cookies`,
      lastModified: today,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];
}
