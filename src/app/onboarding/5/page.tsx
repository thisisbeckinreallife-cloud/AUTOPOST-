"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { StepShell } from "@/components/onboarding/StepShell";
import { Button } from "@/components/brand/Button";

export default function OnboardingStep5() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  async function finish() {
    setLoading(true);
    try {
      await fetch("/api/onboarding/complete", { method: "POST" });
      router.push("/dashboard");
    } catch {
      router.push("/dashboard");
    }
  }

  return (
    <StepShell
      step={5}
      title="¡Listo, ya estás publicando!"
      sub="Tu primer calendario está activo. Tú vuelves a crear, Autopost se encarga del resto."
      backHref="/onboarding/4"
    >
      <div className="bg-gradient-to-b from-pri-soft to-ink-1 border border-pri/40 rounded-2xl p-8 mb-6 text-center">
        <div className="text-6xl mb-4" aria-hidden="true">🎉</div>
        <p className="font-np-mono text-np-caption text-pri uppercase tracking-widest mb-3">
          Tu próxima publicación
        </p>
        <p className="font-np-sans text-np-h2 font-semibold text-ink-9 mb-2 tracking-tight">
          Mañana · 09:00
        </p>
        <p className="text-np-body-lg text-ink-7">
          Reel — Presentación de tu marca
          <br />
          en <strong className="text-ink-9">Instagram</strong>
        </p>
      </div>

      <div className="bg-ink-1 border border-ink-3 rounded-xl p-5 mb-6">
        <h3 className="font-np-sans text-np-h4 font-semibold text-ink-9 mb-3">
          Lo que pasa ahora
        </h3>
        <ul className="flex flex-col gap-2 text-np-body text-ink-7">
          <li className="flex items-start gap-2">
            <span aria-hidden="true" className="text-[color:var(--np-success)] flex-shrink-0">✓</span>
            <span>Tu calendario está organizado. Te avisaremos antes de cada publicación.</span>
          </li>
          <li className="flex items-start gap-2">
            <span aria-hidden="true" className="text-[color:var(--np-success)] flex-shrink-0">✓</span>
            <span>Puedes editar cualquier post antes de que salga, en cualquier momento.</span>
          </li>
          <li className="flex items-start gap-2">
            <span aria-hidden="true" className="text-[color:var(--np-success)] flex-shrink-0">✓</span>
            <span>Cuando se publique, te llega un aviso con el resultado.</span>
          </li>
        </ul>
      </div>

      <Button variant="primary" size="lg" fullWidth loading={loading} onClick={finish}>
        Ir a mi panel
        <span aria-hidden="true">→</span>
      </Button>

      <p className="text-center text-np-caption text-ink-6 mt-4">
        ¿Necesitas ayuda? Escríbenos a{" "}
        <a href="mailto:soporte@autopost.app" className="text-pri hover:underline">
          soporte@autopost.app
        </a>
      </p>
    </StepShell>
  );
}
