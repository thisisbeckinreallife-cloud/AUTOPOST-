import {
  PillNav,
  Hero,
  HowItWorks,
  InsideTour,
  Pricing,
  Faq,
  Footer,
} from "@/components/landing-v2";

export const metadata = {
  title: "Autopost · Tira la carpeta. El resto va solo.",
  description:
    "Sube una carpeta de posts. La IA detecta formato, sugiere hora y monta el calendario. Tú apruebas. Autopost publica solo en Instagram, TikTok, X, LinkedIn, YouTube y Threads.",
};

/**
 * /  — Landing (Fase 2 plan funcional simplificado).
 *
 * Brand-new UI con paleta azul+violeta dark. Reemplaza el editorial
 * print-zine v1 que vive en /src/components/landing/ (preservado por
 * si necesitamos revertir).
 *
 * Componentes en /src/components/landing-v2/:
 *  - PillNav: nav top sticky con cursor gradient sliding.
 *  - Hero: centrado tipo 21st.dev con gradient en línea 2.
 *  - HowItWorks: 3 pasos para no técnicos (carpeta → IA → publica).
 *  - InsideTour: 4 cards explicando el producto sin tecnicismos.
 *  - Pricing: 3 tiers con toggle mensual/anual.
 *  - Faq: acordeón con 5 preguntas frecuentes.
 *  - Footer: Stripe-style con cuenta + soporte.
 *
 * Wrap completo en .np-root para forzar 17px base, focus visible azul,
 * font Geist y prefers-reduced-motion.
 */
export default function HomePage() {
  return (
    <div className="np-root min-h-screen bg-ink-0">
      <PillNav />
      <main>
        <Hero />
        <HowItWorks />
        <InsideTour />
        <Pricing />
        <Faq />
      </main>
      <Footer />
    </div>
  );
}
