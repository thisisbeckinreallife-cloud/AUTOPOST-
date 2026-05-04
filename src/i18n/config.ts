/**
 * /src/i18n/config.ts — next-intl configuration (Fase 1).
 *
 * Setup minimalista para Fase 1: locales, default, helpers para client/server.
 * Por ahora NO activamos middleware con prefijo de URL (/es, /en) porque
 * eso forzaría rewrites del producto entero. En su lugar:
 *
 *   - Server: leemos cookie 'autopost-locale' (set desde client toggle)
 *   - Client: usamos NextIntlClientProvider envuelto en el layout
 *   - Fallback: navigator.language o 'es'
 *
 * Cuando migremos páginas legacy a next-intl, podemos activar el middleware
 * con prefijo en una segunda fase sin tocar este config.
 */

export const SUPPORTED_LOCALES = ["es", "en"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "es";
export const LOCALE_COOKIE = "autopost-locale";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/**
 * Detecta el locale a usar dado un valor candidato (cookie, header, etc.)
 * Cae al DEFAULT_LOCALE si no es válido.
 */
export function resolveLocale(candidate: string | undefined | null): Locale {
  if (isLocale(candidate)) return candidate;
  if (typeof candidate === "string") {
    const short = candidate.toLowerCase().slice(0, 2);
    if (isLocale(short)) return short;
  }
  return DEFAULT_LOCALE;
}
