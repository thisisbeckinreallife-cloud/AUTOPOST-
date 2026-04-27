"use client";

import { I18nProvider } from "@/components/editorial/i18n";
import { EditorialHero } from "@/components/editorial/EditorialHero";

export default function LandingPage() {
  return (
    <I18nProvider defaultLang="es">
      <EditorialHero />
    </I18nProvider>
  );
}
