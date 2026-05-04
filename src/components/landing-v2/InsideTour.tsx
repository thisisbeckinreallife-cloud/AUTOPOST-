import * as React from "react";
import Link from "next/link";
import { cn } from "@/components/brand/cn";

/**
 * InsideTour — Fase 2 plan funcional.
 *
 * 4 cards explicando "Por dentro" del producto sin tecnicismos.
 * Para usuarios no-técnicos (objetivo: tercera edad se entera).
 *
 * Cada card tiene un step number visible + título plano + descripción +
 * preview visual inline (stage del componente real).
 */
export function InsideTour() {
  return (
    <section id="features" className="py-24 px-6 max-w-[1100px] mx-auto">
      <header className="text-center max-w-[720px] mx-auto mb-16">
        <div className="inline-block font-np-mono text-np-caption text-pri uppercase tracking-widest mb-3">
          POR DENTRO
        </div>
        <h2 className="font-np-sans text-np-display font-semibold text-ink-9 leading-tight tracking-tight">
          Así es Autopost por dentro.
        </h2>
        <p className="text-np-body-lg text-ink-7 mt-4">
          Cuatro momentos del producto. Sin tecnicismos.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-4">
        <TourCard
          step="01"
          tag="Subir"
          title="Sueltas la carpeta. Ya está."
          desc="Arrastra desde tu Mac, Drive o Dropbox. Vídeos, imágenes, textos. Autopost los guarda y empieza a trabajar."
        >
          <UploadStage />
        </TourCard>

        <TourCard
          step="02"
          tag="IA"
          title="La IA lee cada post. Y te lo explica."
          desc="Te dice qué ha visto en cada archivo, en qué red encaja mejor y a qué hora rinde más. En español."
        >
          <AiStage />
        </TourCard>

        <TourCard
          step="03"
          tag="Calendario"
          title="Tu mes, ya organizado."
          desc="Cada punto es una publicación. Cada color, una red. Si quieres mover algo, lo arrastras y ya."
        >
          <CalendarStage />
        </TourCard>

        <TourCard
          step="04"
          tag="Publica"
          title="Y tú te enteras cuando ya está hecho."
          desc="Cuando llega la hora, Autopost publica desde tu cuenta. Te llega aviso. Tú vuelves a crear."
        >
          <ToastsStage />
        </TourCard>
      </div>

      <div className="flex justify-center mt-10">
        <Link
          href="/signup"
          className={cn(
            "inline-flex items-center justify-center h-12 px-6 gap-2 rounded-lg",
            "bg-transparent text-ink-8 border border-ink-3 font-medium text-np-body",
            "hover:border-ink-5 hover:bg-ink-1 hover:text-ink-9 transition-all"
          )}
        >
          Pruébalo gratis →
        </Link>
      </div>
    </section>
  );
}

function TourCard({
  step,
  tag,
  title,
  desc,
  children,
}: {
  step: string;
  tag: string;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <article className="bg-gradient-to-b from-ink-1 to-ink-0 border border-ink-3 rounded-2xl p-8 transition-colors hover:border-ink-4">
      <span className="inline-flex items-center gap-2 px-2.5 py-1 mb-4 border border-ink-3 rounded-full bg-ink-1 font-np-mono text-np-caption text-ink-7 uppercase tracking-widest">
        <span className="text-pri font-semibold">{step}</span> · {tag}
      </span>
      <h3 className="font-np-sans text-np-h3 font-semibold text-ink-9 mb-2 tracking-tight">
        {title}
      </h3>
      <p className="text-np-body text-ink-7 mb-6 max-w-[480px] leading-normal">
        {desc}
      </p>
      <div className="bg-ink-0 border border-ink-3 rounded-xl p-6 overflow-hidden relative">
        {children}
      </div>
    </article>
  );
}

function UploadStage() {
  return (
    <div className="flex flex-col gap-3">
      <div className="border-2 border-dashed border-pri rounded-md p-6 text-center bg-pri-soft">
        <div className="w-10 h-10 mx-auto mb-2 bg-ink-2 rounded-md flex items-center justify-center text-ink-7">
          ↑
        </div>
        <div className="font-np-mono text-np-caption text-ink-8 font-medium">
          posts/abril-2026.zip · 24 archivos
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <FileRow name="reel-anuncio.mov" status="✓ subido" statusColor="success" />
        <FileRow name="carrusel-3-img.zip" status="analizando" statusColor="ai" />
      </div>
    </div>
  );
}

function FileRow({
  name,
  status,
  statusColor,
}: {
  name: string;
  status: string;
  statusColor: "success" | "ai";
}) {
  const cls =
    statusColor === "ai"
      ? "bg-ai-soft text-ai"
      : "bg-[color:var(--np-success-soft)] text-[color:var(--np-success)]";
  return (
    <div className="grid grid-cols-[24px_1fr_auto] items-center gap-2 px-2.5 py-2 bg-ink-1 border border-ink-3 rounded font-np-mono text-[11px]">
      <div className="w-6 h-6 bg-ink-2 rounded flex items-center justify-center text-ink-7 text-[10px]">
        ▭
      </div>
      <span className="text-ink-9 truncate">{name}</span>
      <span className={cn("px-1.5 py-0.5 rounded-full text-[9px] uppercase tracking-wider", cls)}>
        {statusColor === "ai" ? "✦ " : ""}
        {status}
      </span>
    </div>
  );
}

function AiStage() {
  return (
    <div className="flex items-center gap-6 p-2">
      <div
        className="w-[110px] h-[140px] rounded-lg shadow-md flex-shrink-0 relative"
        style={{
          background: "linear-gradient(135deg, rgba(79,124,255,0.5), rgba(168,85,247,0.5))",
        }}
      />
      <dl className="flex flex-col gap-2 flex-1">
        <LabelRow label="Tipo" pills={[{ text: "Carrusel · 3 imágenes" }]} />
        <LabelRow label="Redes" pills={[{ text: "Instagram", ai: true }, { text: "LinkedIn", ai: true }]} />
        <LabelRow label="Hora" pills={[{ text: "Martes 14:30", ai: true }]} />
        <LabelRow label="Tono" pills={[{ text: "Profesional cálido", ai: true }]} />
      </dl>
    </div>
  );
}

function LabelRow({
  label,
  pills,
}: {
  label: string;
  pills: Array<{ text: string; ai?: boolean }>;
}) {
  return (
    <div className="grid grid-cols-[80px_1fr] gap-3 items-center font-np-sans text-np-caption">
      <dt className="font-np-mono text-[10px] text-ink-6 uppercase tracking-wider">
        {label}
      </dt>
      <dd className="text-ink-9 font-medium flex flex-wrap gap-1">
        {pills.map((p, i) => (
          <span
            key={i}
            className={cn(
              "inline-block px-2 py-0.5 rounded-full border text-[10px]",
              p.ai
                ? "bg-ai-soft border-ai/40 text-ai"
                : "bg-ink-2 border-ink-3 text-ink-8"
            )}
          >
            {p.ai ? "✦ " : ""}
            {p.text}
          </span>
        ))}
      </dd>
    </div>
  );
}

function CalendarStage() {
  const cells: Array<{ c?: string; ai?: boolean }> = [
    { c: "#E4405F" }, {}, { ai: true }, {}, { c: "#1DA1F2" }, {}, {},
    { c: "#0A66C2" }, { c: "#FF0050" }, {}, { ai: true }, {}, { c: "#FF0000" }, {},
    {}, { c: "#E4405F" }, { ai: true }, {}, { c: "#0A66C2" }, {}, { c: "#E4405F" },
  ];
  return (
    <div className="grid grid-cols-7 grid-rows-[16px_repeat(3,32px)] gap-1">
      {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
        <div key={d} className="font-np-mono text-[9px] text-ink-6 text-center tracking-wider">
          {d}
        </div>
      ))}
      {cells.map((cell, i) => (
        <div
          key={i}
          className={cn(
            "bg-ink-2 border rounded relative",
            cell.c || cell.ai ? "border-ink-4" : "border-transparent"
          )}
        >
          {cell.c || cell.ai ? (
            <div
              className={cn(
                "absolute top-1 left-1 w-1.5 h-1.5 rounded-full",
                cell.ai && "animate-pulse"
              )}
              style={{ background: cell.ai ? "var(--ai)" : cell.c }}
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}

function ToastsStage() {
  return (
    <div className="flex flex-col gap-2">
      <ToastRow icon="✓" title="Publicado en Instagram" desc="Reel — anuncio Q2" time="hace 2 min" success />
      <ToastRow icon="✓" title="Publicado en LinkedIn" desc="Carrusel — case study" time="hace 5 min" success />
      <ToastRow icon="⏱" title="Programado · TikTok" desc="Detrás cámara · sale a las 18:00" time="en 3h 12min" />
    </div>
  );
}

function ToastRow({
  icon,
  title,
  desc,
  time,
  success,
}: {
  icon: string;
  title: string;
  desc: string;
  time: string;
  success?: boolean;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-[28px_1fr_auto] items-center gap-3 px-3 py-2.5",
        "bg-ink-1 border border-ink-3 rounded-md font-np-sans text-np-caption",
        "border-l-[3px]",
        success ? "border-l-[color:var(--np-success)]" : "border-l-pri"
      )}
    >
      <div
        className={cn(
          "w-7 h-7 rounded-full bg-ink-2 flex items-center justify-center text-[14px]",
          success ? "text-[color:var(--np-success)]" : "text-pri"
        )}
      >
        {icon}
      </div>
      <div>
        <strong className="block text-ink-9 font-medium">{title}</strong>
        <span className="text-ink-6 font-np-mono text-[11px]">{desc}</span>
      </div>
      <span className="font-np-mono text-[10px] text-ink-6 whitespace-nowrap">{time}</span>
    </div>
  );
}
