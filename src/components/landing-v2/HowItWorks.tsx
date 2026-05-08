import * as React from "react";
import { cn } from "@/components/brand/cn";

/**
 * HowItWorks — Fase 2 plan funcional.
 *
 * Tres pasos visuales para no-técnicos:
 *  1. Tira la carpeta — visual: carpeta con icono
 *  2. La IA lo entiende — visual: tags violetas flotando sobre imagen
 *  3. Y publica solo — visual: mini calendario con cells coloreadas por red
 *
 * Lenguaje plano: "La IA lo entiende" en lugar de "interpreta",
 * "Y publica solo" en lugar de "scheduling automático".
 */
export function HowItWorks() {
  return (
    <section id="how" className="py-24 px-6 max-w-[1200px] mx-auto">
      <header className="text-center max-w-[720px] mx-auto mb-16">
        <div className="inline-block font-np-mono text-np-caption text-pri uppercase tracking-widest mb-3">
          CÓMO FUNCIONA
        </div>
        <h2 className="font-np-sans text-np-display font-semibold text-ink-9 leading-tight tracking-tight">
          Tres pasos. Sin fricción.
        </h2>
        <p className="text-np-body-lg text-ink-7 mt-4">
          Subes la carpeta. La IA la entiende. El calendario se publica solo.
        </p>
      </header>

      <div className="grid md:grid-cols-3 gap-4">
        <Step
          n="01"
          title="Tira la carpeta"
          desc="Imágenes, vídeos, copys, drafts mezclados. Da igual el orden — cero edición previa."
          visual={<FolderVisual />}
          icon="📁"
        />
        <Step
          n="02"
          title="La IA lo entiende"
          desc="Detecta qué es cada cosa, en qué red va y a qué hora rinde mejor."
          visual={<AiTagsVisual />}
          icon="✦"
          isAi
        />
        <Step
          n="03"
          title="Y publica solo"
          desc="Tú apruebas. Autopost publica en cada red en su momento. Tú vuelves a crear."
          visual={<CalendarVisual />}
          icon="📅"
        />
      </div>
    </section>
  );
}

function Step({
  n,
  title,
  desc,
  visual,
  icon,
  isAi,
}: {
  n: string;
  title: string;
  desc: string;
  visual: React.ReactNode;
  icon: string;
  isAi?: boolean;
}) {
  return (
    <div className="bg-gradient-to-b from-ink-1 to-ink-0 border border-ink-3 rounded-2xl p-8 transition-colors hover:border-ink-4">
      <div className="flex items-center justify-between mb-4">
        <span className="font-np-mono text-np-caption text-ink-6 tracking-widest font-medium">
          Paso {n}
        </span>
        <span
          className={cn(
            "w-9 h-9 rounded-md border flex items-center justify-center text-lg",
            isAi
              ? "border-ai/40 bg-ai-soft text-ai"
              : "bg-ink-2 border-ink-3 text-ink-8"
          )}
        >
          {icon}
        </span>
      </div>
      <h3 className="font-np-sans text-np-h3 font-semibold text-ink-9 mb-3 tracking-tight">
        {title}
      </h3>
      <p className="text-np-body text-ink-7 mb-6 leading-normal">{desc}</p>
      <div className="h-[200px] bg-ink-0 border border-ink-3 rounded-xl flex items-center justify-center relative overflow-hidden">
        {visual}
      </div>
    </div>
  );
}

function FolderVisual() {
  return (
    <div className="relative">
      <div className="relative w-32 h-24 transform -rotate-3 hover:rotate-0 transition-transform">
        <div
          className="absolute inset-0 rounded-lg bg-gradient-to-br from-ink-3 to-ink-2 border border-pri shadow-[var(--np-glow-blue)]"
          style={{ borderRadius: "6px 12px 8px 8px" }}
        />
        <div
          className="absolute -top-2 left-3 w-12 h-3 bg-ink-3 border border-ink-4 border-b-0"
          style={{ borderRadius: "6px 6px 0 0" }}
        />
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 font-np-mono text-[10px] text-pri uppercase tracking-widest">
          posts/abril
        </div>
      </div>
    </div>
  );
}

function AiTagsVisual() {
  return (
    <div className="relative w-3/4 h-full flex items-center justify-center">
      <div
        className="w-24 h-32 rounded-lg shadow-md relative bg-ink-3 border border-ink-4"
      />
      <Tag style={{ top: "14%", right: "0%", animationDelay: "0.4s" }}>Carrusel · 3 imágenes</Tag>
      <Tag style={{ top: "38%", left: "-15%", animationDelay: "0.8s" }}>IG + LinkedIn</Tag>
      <Tag style={{ bottom: "22%", right: "-8%", animationDelay: "1.2s" }}>Mejor hora · 14:30</Tag>
      <Tag style={{ bottom: "6%", left: "10%", animationDelay: "1.6s" }}>Tono profesional</Tag>
    </div>
  );
}

function Tag({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={cn(
        "absolute inline-flex items-center gap-1 px-2 py-1 rounded-full",
        "bg-ai-soft border border-ai/40 backdrop-blur-sm",
        "font-np-mono text-[10px] text-ai whitespace-nowrap",
        "np-anim-tag-pop"
      )}
      style={style}
    >
      <span aria-hidden="true">✦</span>
      {children}
    </span>
  );
}

function CalendarVisual() {
  const cells: Array<{ pf?: string; ai?: boolean }> = [
    { pf: "#E4405F" }, {}, { ai: true }, {}, { pf: "#1DA1F2" }, {}, {},
    { pf: "#0A66C2" }, { pf: "#FF0050" }, {}, { ai: true }, {}, { pf: "#FF0000" }, {},
    {}, { pf: "#E4405F" }, { ai: true }, {}, { pf: "#0A66C2" }, {}, { pf: "#E4405F" },
  ];
  return (
    <div className="w-3/4 bg-ink-1 border border-ink-3 rounded-md p-2.5">
      <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-ink-3">
        <span className="font-np-mono text-[9px] text-ink-7 uppercase tracking-widest">
          Esta semana
        </span>
        <span aria-hidden="true" className="font-np-mono text-[9px] text-ink-6 tracking-wider">
          7 redes
        </span>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
          <div key={d} className="font-np-mono text-[8px] text-ink-6 text-center">
            {d}
          </div>
        ))}
        {cells.map((cell, i) => (
          <div
            key={i}
            className={cn(
              "h-6 rounded relative",
              cell.pf || cell.ai ? "bg-ink-3" : "bg-ink-2"
            )}
          >
            {cell.pf || cell.ai ? (
              <div
                className="absolute top-1 left-1 w-1 h-1 rounded-full"
                style={{ background: cell.ai ? "var(--ai)" : cell.pf }}
              />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
