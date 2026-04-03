"use client";

import { useState, useEffect } from "react";
import { ToastProvider } from "@/components/ui/toast";
import { I18nProvider, detectLocale, type Locale } from "@/lib/i18n";

export function Providers({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>("es");

  useEffect(() => {
    // Check localStorage first, then detect from browser
    const saved = localStorage.getItem("autopost-locale") as Locale | null;
    setLocale(saved ?? detectLocale());
  }, []);

  return (
    <I18nProvider value={locale}>
      <ToastProvider>{children}</ToastProvider>
    </I18nProvider>
  );
}
