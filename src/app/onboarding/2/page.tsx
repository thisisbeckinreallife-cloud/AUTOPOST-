"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { StepShell } from "@/components/onboarding/StepShell";
import { Button } from "@/components/brand/Button";
import { cn } from "@/components/brand/cn";

interface Network {
  id: string;
  name: string;
  desc: string;
  recommended?: boolean;
  color: string;
  href?: string;
  available: boolean;
}

// El estado available depende de credenciales en backend. Por ahora todos
// muestran flow de OAuth que devuelve 503 si no está configurado, y la
// UI muestra "Próximamente" si no hay credenciales.
const NETWORKS: Network[] = [
  {
    id: "instagram",
    name: "Instagram",
    desc: "Reels, stories, carruseles. Lo más usado.",
    recommended: true,
    color: "#E4405F",
    href: "/api/meta/oauth/start?from=/onboarding/2",
    available: false, // será true cuando META_APP_ID esté
  },
  {
    id: "facebook",
    name: "Facebook",
    desc: "Páginas y grupos. Conectado con Instagram.",
    color: "#1877F2",
    href: "/api/meta/oauth/start?from=/onboarding/2",
    available: false,
  },
  {
    id: "tiktok",
    name: "TikTok",
    desc: "Vídeos cortos. Perfecto para alcance orgánico.",
    color: "#FF0050",
    available: false,
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    desc: "B2B, casos de éxito, contenido profesional.",
    color: "#0A66C2",
    available: false,
  },
];

export default function OnboardingStep2() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  async function next() {
    setLoading(true);
    try {
      await fetch("/api/onboarding/step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: 3 }),
      });
      router.push("/onboarding/3");
    } catch {
      setLoading(false);
    }
  }

  function skip() {
    if (confirm("¿Saltar la guía? Podrás conectar redes después desde el panel.")) {
      void fetch("/api/onboarding/complete", { method: "POST" }).then(() => router.push("/dashboard"));
    }
  }

  return (
    <StepShell
      step={2}
      title="Conecta tu primera red social"
      sub="La que más usas. Podrás añadir las demás después en un click."
      onSkip={skip}
      backHref="/onboarding/1"
    >
      <div className="flex flex-col gap-3 mb-6">
        {NETWORKS.map((net) => (
          <NetworkCard key={net.id} network={net} />
        ))}
      </div>

      <div className="flex flex-col gap-2 mt-4">
        <Button variant="ghost" size="lg" fullWidth onClick={next} loading={loading}>
          Lo haré después
          <span aria-hidden="true">→</span>
        </Button>
      </div>
    </StepShell>
  );
}

function NetworkCard({ network }: { network: Network }) {
  const Component = network.href && network.available ? "a" : "div";
  return (
    <Component
      {...(Component === "a" ? { href: network.href } : {})}
      className={cn(
        "relative flex items-center gap-4 p-5 rounded-xl border transition-all",
        network.available
          ? "bg-ink-1 border-ink-3 hover:border-ink-5 hover:bg-ink-2 cursor-pointer"
          : "bg-ink-1 border-ink-3 opacity-60 cursor-not-allowed"
      )}
    >
      <div
        aria-hidden="true"
        className="w-12 h-12 rounded-lg flex items-center justify-center text-ink-10 font-bold text-lg flex-shrink-0"
        style={{ background: network.color }}
      >
        {network.name.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-np-sans text-np-h4 text-ink-9 font-medium">{network.name}</span>
          {network.recommended && network.available ? (
            <span className="font-np-mono text-[10px] uppercase tracking-wider text-pri bg-pri-soft px-2 py-0.5 rounded-full">
              Recomendado
            </span>
          ) : null}
        </div>
        <p className="text-np-caption text-ink-7">{network.desc}</p>
      </div>
      <div className="flex-shrink-0">
        {network.available ? (
          <span aria-hidden="true" className="text-ink-7 text-xl">→</span>
        ) : (
          <span className="font-np-mono text-[10px] uppercase tracking-wider text-ink-6 bg-ink-2 px-2 py-1 rounded-full">
            Próximamente
          </span>
        )}
      </div>
    </Component>
  );
}
