/**
 * /src/i18n/request.ts — next-intl server config.
 *
 * getRequestConfig() es llamado en cada request server-side (RSC) para
 * resolver el locale + cargar el JSON de mensajes correspondiente.
 *
 * Lee la cookie autopost-locale; si no existe o no es válida, default = es.
 *
 * Las páginas Server Components pueden usar getTranslations(namespace).
 * Las páginas Client Components usan useTranslations(namespace) wrapped en
 * <NextIntlClientProvider> (ver Phase2Provider en src/components/brand/).
 */

import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, resolveLocale, type Locale } from "./config";

export default getRequestConfig(async () => {
  let locale: Locale = DEFAULT_LOCALE;

  try {
    const cookieStore = cookies();
    const cookieValue = cookieStore.get(LOCALE_COOKIE)?.value;
    if (cookieValue) {
      locale = resolveLocale(cookieValue);
    } else {
      // Fallback: Accept-Language header
      const headersList = headers();
      const accept = headersList.get("accept-language");
      if (accept) {
        const first = accept.split(",")[0]?.trim();
        locale = resolveLocale(first);
      }
    }
  } catch {
    // SSG / build time: no request — use default
    locale = DEFAULT_LOCALE;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
