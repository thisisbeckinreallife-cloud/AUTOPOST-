"use client";

/* ───────────────────────────────────────────────────────────────────
   /hero-preview — sandbox del nuevo HatchHero + sección How-It-Works.
   Permite validar el flujo completo antes de integrar en page.tsx.
   ─────────────────────────────────────────────────────────────────── */

import HatchHero from "@/components/landing/hatch-hero";
import { HatchHowItWorks } from "@/components/landing/hatch-how-it-works";

export default function HeroPreviewPage() {
  return (
    <main>
      <HatchHero />
      <HatchHowItWorks />

      {/* Marker visible al final del scroll para confirmar que termina el flow */}
      <section className="relative bg-zinc-950 text-white py-20 px-6 text-center">
        <h2 className="text-xl font-bold mb-2">— fin del preview —</h2>
        <p className="text-sm text-zinc-400 max-w-md mx-auto">
          Hero pinned (3 viewports) → How-It-Works (3 pasos) → diferencial strip.
        </p>
      </section>
    </main>
  );
}
