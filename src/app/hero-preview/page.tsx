"use client";

/* ───────────────────────────────────────────────────────────────────
   /hero-preview — sandbox aislado del nuevo HatchHero.
   Permite validar mechanics y FPS antes de integrar en page.tsx principal.
   ─────────────────────────────────────────────────────────────────── */

import HatchHero from "@/components/landing/hatch-hero";

export default function HeroPreviewPage() {
  return (
    <main>
      <HatchHero />

      {/* Banda visible al final del scroll para confirmar que termina el pinned */}
      <section className="relative bg-zinc-950 text-white py-24 px-6 text-center">
        <h2 className="text-2xl font-bold mb-2">Fin del hero pinned</h2>
        <p className="text-sm text-zinc-400 max-w-md mx-auto">
          Si llegas a este punto y has visto los 4 actos transicionar suavemente al hacer scroll,
          el mecanismo funciona. Esta sección es solo para confirmar que el sticky se libera correctamente.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 text-xs text-zinc-500">
          <span>← scroll arriba para repetir</span>
        </div>
      </section>
    </main>
  );
}
