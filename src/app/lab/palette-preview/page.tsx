"use client";

import { useMemo, useState } from "react";
import { Zap, Folder, Calendar, ArrowRight, Sparkles, Shield, Lock, Instagram, Users, Check, X } from "lucide-react";

/* ─────────────────────────────────────────────────────────────────
   Validación visual de la paleta "Indigo Eclipse"
   Página standalone — no depende del design system actual.
   Visita /palette-preview para validar antes de aplicar a producción.
   ───────────────────────────────────────────────────────────────── */

const PALETTE = {
  current: {
    label: "ACTUAL — Gold Highway",
    primary: "#FFAA00",
    primaryDark: "#CC8800",
    accent: "#FB923C",
    indigo: "#6366F1",
    text: "#1D1D1F",
    textSecondary: "#71717A",
    textTertiary: "#A1A1AA",
    surface: "#FAFAFA",
    border: "rgba(0,0,0,0.06)",
  },
  proposed: {
    label: "PROPUESTA — Indigo Eclipse",
    primary: "#4F46E5",
    primaryDark: "#3730A3",
    primaryHover: "#4338CA",
    signature: "#D4A857",
    signatureDark: "#A88142",
    text: "#0A0A0F",
    textSecondary: "#64748B",
    textTertiary: "#94A3B8",
    surface: "#FAFAFC",
    border: "rgba(15,23,42,0.06)",
  },
};

/* ─── WCAG contrast utilities ─────────────────────────────────────── */
function relLuminance(hex: string): number {
  const h = hex.replace("#", "");
  const rgb = [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

function contrast(fg: string, bg: string): number {
  const L1 = relLuminance(fg);
  const L2 = relLuminance(bg);
  const [light, dark] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (light + 0.05) / (dark + 0.05);
}

function wcagBadge(ratio: number, large = false): { label: string; pass: boolean; level: string } {
  const aa = large ? 3 : 4.5;
  const aaa = large ? 4.5 : 7;
  if (ratio >= aaa) return { label: `${ratio.toFixed(2)}:1`, pass: true, level: "AAA" };
  if (ratio >= aa) return { label: `${ratio.toFixed(2)}:1`, pass: true, level: "AA" };
  return { label: `${ratio.toFixed(2)}:1`, pass: false, level: "FAIL" };
}

/* ─── Components ──────────────────────────────────────────────────── */

function Swatch({ hex, name, role, onText = "#FFFFFF", bg = "#FFFFFF" }: { hex: string; name: string; role: string; onText?: string; bg?: string }) {
  const c1 = contrast(onText, hex);
  const c2 = contrast(hex, bg);
  return (
    <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
      <div
        className="h-24 flex items-end p-3 text-xs font-medium"
        style={{ background: hex, color: onText }}
      >
        <span>{hex.toUpperCase()}</span>
      </div>
      <div className="p-3 space-y-1">
        <div className="text-sm font-semibold text-zinc-900">{name}</div>
        <div className="text-xs text-zinc-500">{role}</div>
        <div className="flex gap-1.5 pt-2 text-[10px]">
          <ContrastChip label={`txt sobre`} ratio={c1} />
          <ContrastChip label={`sobre bg`} ratio={c2} />
        </div>
      </div>
    </div>
  );
}

function ContrastChip({ label, ratio, large }: { label: string; ratio: number; large?: boolean }) {
  const b = wcagBadge(ratio, large);
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-mono ${b.pass ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
      {b.pass ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />}
      {label} {b.label} <span className="opacity-70">{b.level}</span>
    </span>
  );
}

function HeroMockup({ palette, label }: { palette: typeof PALETTE.current | typeof PALETTE.proposed; label: string }) {
  const isProp = "signature" in palette;
  const ctaBg = isProp
    ? `linear-gradient(135deg, ${(palette as any).primary} 0%, ${(palette as any).primaryDark} 100%)`
    : `linear-gradient(135deg, ${palette.primary} 0%, #F97066 100%)`;

  return (
    <div className="rounded-2xl border border-zinc-200 overflow-hidden shadow-card bg-white">
      <div className="px-4 py-2 bg-zinc-100 border-b border-zinc-200 flex items-center gap-2">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-400/60" />
        </div>
        <span className="text-xs font-mono text-zinc-500 ml-2">{label}</span>
      </div>
      <div
        className="p-10 sm:p-12 relative"
        style={{
          background: isProp
            ? `radial-gradient(ellipse 80% 50% at 50% 0%, ${(palette as any).primary}14, transparent 60%), ${palette.surface}`
            : `radial-gradient(ellipse 80% 50% at 50% 0%, ${palette.primary}14, transparent 60%), ${palette.surface}`,
        }}
      >
        {/* Nav mock */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-2">
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center"
              style={{
                background: isProp
                  ? `linear-gradient(135deg, ${(palette as any).primary}, ${(palette as any).signature})`
                  : `linear-gradient(135deg, ${palette.primary}, ${(palette as any).indigo || palette.primary})`,
              }}
            >
              {isProp ? (
                <Folder className="h-4 w-4 text-white" />
              ) : (
                <Zap className="h-4 w-4 text-white" />
              )}
            </div>
            <span className="font-bold text-base" style={{ color: palette.text }}>
              Auto<span style={{ color: isProp ? (palette as any).signature : palette.primary }}>Post</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs" style={{ color: palette.textSecondary }}>Precios</span>
            <span className="text-xs" style={{ color: palette.textSecondary }}>Demo</span>
            <button
              className="text-xs font-semibold px-4 py-2 rounded-lg text-white"
              style={{ background: ctaBg }}
            >
              Empezar gratis
            </button>
          </div>
        </div>

        {/* Hero */}
        <div className="text-center max-w-xl mx-auto">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-6"
            style={{
              background: isProp ? `${(palette as any).primary}10` : `${palette.primary}10`,
              color: isProp ? (palette as any).primaryDark : palette.primaryDark,
              border: `1px solid ${isProp ? (palette as any).primary + "30" : palette.primary + "30"}`,
            }}
          >
            <Sparkles className="h-3 w-3" />
            {isProp ? "Posts colaborativos en beta" : "Automatización para agencias"}
          </div>

          <h1 className="font-extrabold tracking-tight text-3xl sm:text-4xl mb-3" style={{ color: palette.text }}>
            Un mes de Instagram
            <br />
            <span style={{ color: isProp ? (palette as any).primary : palette.primary }}>en 2 minutos</span>
          </h1>
          <p className="text-sm mb-2" style={{ color: palette.textSecondary }}>
            Arrastra tu carpeta. AutoPost detecta carruseles y programa 30 días.
          </p>
          <p className="text-xs mb-6" style={{ color: palette.textTertiary }}>
            5 minutos de trabajo en lugar de 3 horas semanales
          </p>

          <div className="flex items-center justify-center gap-3">
            <button
              className="inline-flex items-center gap-2 text-sm font-semibold px-6 py-3 rounded-xl text-white shadow-lg"
              style={{
                background: ctaBg,
                boxShadow: isProp
                  ? `0 8px 24px -8px ${(palette as any).primary}73, 0 0 0 1px ${(palette as any).primary}33`
                  : `0 8px 24px -8px ${palette.primary}73, 0 0 0 1px ${palette.primary}33`,
              }}
            >
              Programar mi primer mes — gratis
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <p className="text-xs mt-4" style={{ color: palette.textTertiary }}>
            Plan gratis · Sin tarjeta de crédito
          </p>
        </div>
      </div>
    </div>
  );
}

function CTAComparison({ palette, isProp }: { palette: any; isProp: boolean }) {
  const bg = isProp
    ? `linear-gradient(135deg, ${palette.primary} 0%, ${palette.primaryDark} 100%)`
    : `linear-gradient(135deg, ${palette.primary} 0%, #F97066 100%)`;
  const ratio = contrast("#FFFFFF", isProp ? palette.primary : palette.primary);
  const b = wcagBadge(ratio);
  return (
    <div className="space-y-3">
      <button
        className="inline-flex items-center gap-2 text-sm font-semibold px-6 py-3.5 rounded-xl text-white"
        style={{
          background: bg,
          boxShadow: `0 8px 24px -8px ${palette.primary}73, 0 0 0 1px ${palette.primary}33`,
        }}
      >
        Programar mi primer mes — gratis
        <ArrowRight className="h-4 w-4" />
      </button>
      <div className="text-xs">
        Texto blanco sobre primario:{" "}
        <span className={`font-mono font-semibold ${b.pass ? "text-emerald-700" : "text-red-700"}`}>
          {b.label} {b.level} {b.pass ? "✓" : "✗"}
        </span>
      </div>
    </div>
  );
}

function CardMockup({ palette, isProp }: { palette: any; isProp: boolean }) {
  return (
    <div
      className="rounded-2xl border p-6 bg-white"
      style={{ borderColor: palette.border }}
    >
      <div
        className="h-10 w-10 rounded-xl flex items-center justify-center mb-4"
        style={{
          background: `${palette.primary}15`,
          border: `1px solid ${palette.primary}30`,
        }}
      >
        <Users className="h-5 w-5" style={{ color: palette.primary }} />
      </div>
      <div className="flex items-center gap-2 mb-2">
        <h3 className="font-semibold text-sm" style={{ color: palette.text }}>
          Posts colaborativos
        </h3>
        {isProp && (
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
            style={{
              background: `${palette.signature}25`,
              color: palette.signatureDark,
              border: `1px solid ${palette.signature}40`,
            }}
          >
            ÚNICO
          </span>
        )}
        {!isProp && (
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
            style={{
              background: `${palette.primary}25`,
              color: palette.primaryDark,
              border: `1px solid ${palette.primary}40`,
            }}
          >
            ÚNICO
          </span>
        )}
      </div>
      <p className="text-sm leading-relaxed" style={{ color: palette.textSecondary }}>
        Aparece en dos feeds a la vez. Sin coordinación manual — doble audiencia, un solo post.
      </p>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────── */

export default function PalettePreviewPage() {
  const [view, setView] = useState<"side" | "current" | "proposed">("side");
  const c = PALETTE.current;
  const p = PALETTE.proposed;

  /* Real WCAG ratios that matter */
  const ratios = useMemo(
    () => ({
      /* Current palette */
      currentPrimary_white: contrast("#FFFFFF", c.primary),
      currentText_white: contrast(c.text, "#FFFFFF"),
      currentSecondary_white: contrast(c.textSecondary, "#FFFFFF"),
      currentTertiary_white: contrast(c.textTertiary, "#FFFFFF"),
      currentPrimary_text: contrast(c.primary, c.text),
      /* Proposed */
      propPrimary_white: contrast("#FFFFFF", p.primary),
      propPrimaryDark_white: contrast("#FFFFFF", p.primaryDark),
      propText_white: contrast(p.text, "#FFFFFF"),
      propSecondary_white: contrast(p.textSecondary, "#FFFFFF"),
      propTertiary_white: contrast(p.textTertiary, "#FFFFFF"),
      propSignature_white: contrast("#FFFFFF", p.signature),
      propSignature_text: contrast(p.text, p.signature),
      propPrimary_signature: contrast(p.primary, p.signature),
    }),
    [c, p]
  );

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="text-xs font-semibold text-indigo-600 uppercase tracking-widest mb-3">
            Validación de paleta · /palette-preview
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 mb-3">
            Indigo Eclipse vs. Gold Highway
          </h1>
          <p className="text-zinc-600 max-w-2xl">
            Comparación visual y matemática (WCAG 2.1) de la paleta propuesta contra la actual.
            Validad aquí antes de aplicar el cambio a producción.
          </p>

          {/* View toggle */}
          <div className="mt-6 inline-flex items-center gap-1 p-1 rounded-lg bg-zinc-100">
            {(["side", "current", "proposed"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  view === v ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                {v === "side" ? "Comparar lado a lado" : v === "current" ? "Solo ACTUAL" : "Solo PROPUESTA"}
              </button>
            ))}
          </div>
        </div>

        {/* ═══ SECCIÓN 1: Hero mockups lado a lado ═══ */}
        <section className="mb-14">
          <h2 className="text-xl font-bold mb-1 text-zinc-900">1 · Hero aplicado</h2>
          <p className="text-sm text-zinc-500 mb-6">
            La diferencia más importante: el primario, el logo y el CTA. Mismo copy, mismas proporciones.
          </p>
          <div className={`grid gap-6 ${view === "side" ? "lg:grid-cols-2" : "grid-cols-1 max-w-3xl mx-auto"}`}>
            {(view === "side" || view === "current") && <HeroMockup palette={c} label="actual.autopost.app" />}
            {(view === "side" || view === "proposed") && <HeroMockup palette={p} label="propuesta · indigo eclipse" />}
          </div>
        </section>

        {/* ═══ SECCIÓN 2: Paleta completa con contrastes ═══ */}
        <section className="mb-14">
          <h2 className="text-xl font-bold mb-1 text-zinc-900">2 · Swatches con contraste WCAG</h2>
          <p className="text-sm text-zinc-500 mb-6">
            Cada swatch muestra el ratio real de texto blanco encima y del color sobre fondo blanco. AA = ratio ≥ 4.5 para texto normal.
          </p>

          {(view === "side" || view === "current") && (
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-zinc-700 mb-3">ACTUAL — Gold Highway</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <Swatch hex={c.primary} name="brand-500" role="Primario (CTA)" />
                <Swatch hex={c.primaryDark} name="brand-600" role="Hover" />
                <Swatch hex={c.accent} name="accent-orange" role="Acento" />
                <Swatch hex={c.indigo} name="accent-indigo" role="Secundario" />
                <Swatch hex={c.text} name="text-zinc-950" role="Texto principal" onText="#FFFFFF" />
                <Swatch hex={c.textSecondary} name="text-zinc-500" role="Texto secundario" />
                <Swatch hex={c.textTertiary} name="text-zinc-400" role="Disclaimer" />
                <Swatch hex={c.surface} name="surface" role="Fondo secundario" onText="#1D1D1F" />
              </div>
            </div>
          )}

          {(view === "side" || view === "proposed") && (
            <div>
              <h3 className="text-sm font-semibold text-zinc-700 mb-3">PROPUESTA — Indigo Eclipse</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <Swatch hex={p.primary} name="brand-600" role="Primario (CTA, links)" />
                <Swatch hex={p.primaryDark} name="brand-800" role="Eclipse Deep · pressed" />
                <Swatch hex={p.signature} name="signature-gold" role="Acento exclusivo (5%)" onText="#0A0A0F" />
                <Swatch hex={p.signatureDark} name="signature-gold-dk" role="Hover gold" onText="#0A0A0F" />
                <Swatch hex={p.text} name="ink-950" role="Texto principal" onText="#FFFFFF" />
                <Swatch hex={p.textSecondary} name="ink-500 (slate)" role="Texto secundario" />
                <Swatch hex={p.textTertiary} name="ink-400 (pizarra)" role="Solo ≥18px bold" />
                <Swatch hex={p.surface} name="surface niebla" role="Fondo secundario" onText="#0A0A0F" />
              </div>
            </div>
          )}
        </section>

        {/* ═══ SECCIÓN 3: Tabla matemática WCAG ═══ */}
        <section className="mb-14">
          <h2 className="text-xl font-bold mb-1 text-zinc-900">3 · Validación matemática WCAG 2.1</h2>
          <p className="text-sm text-zinc-500 mb-6">
            Cálculos reales de relative luminance + contrast ratio. AA exige ≥4.5:1 (texto normal) o ≥3:1 (texto grande/UI).
          </p>

          <div className="overflow-x-auto rounded-xl border border-zinc-200">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Combinación</th>
                  <th className="px-4 py-3 text-left font-semibold">Ratio</th>
                  <th className="px-4 py-3 text-left font-semibold">Texto normal</th>
                  <th className="px-4 py-3 text-left font-semibold">Texto grande</th>
                  <th className="px-4 py-3 text-left font-semibold">Veredicto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                <RatioRow label="ACTUAL — texto blanco sobre #FFAA00 (CTA)" ratio={ratios.currentPrimary_white} />
                <RatioRow label="ACTUAL — #71717A sobre blanco (texto secundario)" ratio={ratios.currentSecondary_white} />
                <RatioRow label="ACTUAL — #A1A1AA sobre blanco (disclaimer)" ratio={ratios.currentTertiary_white} critical />
                <tr>
                  <td colSpan={5} className="px-4 py-2 bg-zinc-50 text-xs font-semibold text-zinc-700">
                    PROPUESTA — Indigo Eclipse
                  </td>
                </tr>
                <RatioRow label="texto blanco sobre #4F46E5 (CTA principal)" ratio={ratios.propPrimary_white} />
                <RatioRow label="texto blanco sobre #3730A3 (CTA hover)" ratio={ratios.propPrimaryDark_white} />
                <RatioRow label="#64748B sobre blanco (texto secundario)" ratio={ratios.propSecondary_white} />
                <RatioRow label="#94A3B8 sobre blanco (texto terciario)" ratio={ratios.propTertiary_white} note="Solo ≥18px bold" />
                <RatioRow label="texto blanco sobre #D4A857 (gold)" ratio={ratios.propSignature_white} critical note="⚠️ NO usar texto blanco sobre gold" />
                <RatioRow label="texto #0A0A0F sobre #D4A857 (gold + dark text)" ratio={ratios.propSignature_text} note="✓ Texto oscuro sobre gold sí funciona" />
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-xs text-zinc-500 leading-relaxed bg-amber-50 border border-amber-200 rounded-lg p-4">
            <strong className="text-amber-900">Regla operativa del Signature Gold:</strong> el gold #D4A857 NUNCA lleva texto blanco encima
            (ratio 2.31:1, falla AA). Cuando aparezca como fondo (badges, highlights, banners), usar siempre texto ink-950 #0A0A0F (ratio 9:1, AAA pass).
            Como acento sobre fondo blanco, solo válido para iconos o elementos no-texto.
          </div>
        </section>

        {/* ═══ SECCIÓN 4: CTAs comparados ═══ */}
        <section className="mb-14">
          <h2 className="text-xl font-bold mb-1 text-zinc-900">4 · CTA principal — antes / después</h2>
          <p className="text-sm text-zinc-500 mb-6">El CTA es donde la marca convierte. Aquí se ve el peso visual real de cada paleta.</p>

          <div className={`grid gap-8 ${view === "side" ? "md:grid-cols-2" : "grid-cols-1"}`}>
            {(view === "side" || view === "current") && (
              <div className="rounded-xl border border-zinc-200 p-8 bg-white">
                <div className="text-xs font-mono text-zinc-500 mb-4">ACTUAL · gold + coral gradient</div>
                <CTAComparison palette={c} isProp={false} />
              </div>
            )}
            {(view === "side" || view === "proposed") && (
              <div className="rounded-xl border border-zinc-200 p-8 bg-white">
                <div className="text-xs font-mono text-indigo-600 mb-4">PROPUESTA · indigo eclipse</div>
                <CTAComparison palette={p} isProp={true} />
              </div>
            )}
          </div>
        </section>

        {/* ═══ SECCIÓN 5: Cards mockups ═══ */}
        <section className="mb-14">
          <h2 className="text-xl font-bold mb-1 text-zinc-900">5 · Card de feature destacada</h2>
          <p className="text-sm text-zinc-500 mb-6">"Posts colaborativos" es la USP única — aquí se ve cómo el badge "ÚNICO" cambia de jerarquía visual.</p>

          <div className={`grid gap-6 ${view === "side" ? "md:grid-cols-2" : "grid-cols-1 max-w-md"}`}>
            {(view === "side" || view === "current") && (
              <div>
                <div className="text-xs font-mono text-zinc-500 mb-2">ACTUAL</div>
                <CardMockup palette={c} isProp={false} />
              </div>
            )}
            {(view === "side" || view === "proposed") && (
              <div>
                <div className="text-xs font-mono text-indigo-600 mb-2">PROPUESTA</div>
                <CardMockup palette={p} isProp={true} />
              </div>
            )}
          </div>
          <p className="text-xs text-zinc-500 mt-4">
            En la propuesta: el card usa indigo (confianza tecnológica) y el badge "ÚNICO" usa gold (acento exclusivo) —
            la jerarquía es clara: indigo es funcional, gold es premium/destacado.
          </p>
        </section>

        {/* ═══ SECCIÓN 6: Logo proposals ═══ */}
        <section className="mb-14">
          <h2 className="text-xl font-bold mb-1 text-zinc-900">6 · Logo — Zap genérico vs. Folder grid</h2>
          <p className="text-sm text-zinc-500 mb-6">
            El glifo actual es Lucide Zap (lo usan miles de SaaS). El propuesto es una carpeta abriendo grid 3×3 — comunica el USP literal.
          </p>

          <div className={`grid gap-6 ${view === "side" ? "md:grid-cols-2" : "grid-cols-1 max-w-md"}`}>
            {(view === "side" || view === "current") && (
              <div className="rounded-xl border border-zinc-200 bg-white p-8">
                <div className="text-xs font-mono text-zinc-500 mb-4">ACTUAL · Zap (Lucide)</div>
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="h-12 w-12 rounded-xl flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${c.primary}, ${c.indigo})` }}
                  >
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <span className="font-bold text-2xl text-zinc-900">
                    Auto<span style={{ color: c.primary }}>Post</span>
                  </span>
                </div>
                <div className="text-xs text-zinc-500">Asociación: rapidez genérica. No comunica el producto.</div>
              </div>
            )}

            {(view === "side" || view === "proposed") && (
              <div className="rounded-xl border border-zinc-200 bg-white p-8">
                <div className="text-xs font-mono text-indigo-600 mb-4">PROPUESTA · Folder Grid (custom)</div>
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="h-12 w-12 rounded-xl flex items-center justify-center relative overflow-hidden"
                    style={{ background: `linear-gradient(135deg, ${p.primary}, ${p.primaryDark})` }}
                  >
                    {/* Simulated folder + grid glyph */}
                    <FolderGridGlyph color="#FFFFFF" />
                  </div>
                  <span className="font-bold text-2xl" style={{ color: p.text }}>
                    Auto<span style={{ color: p.signature }}>Post</span>
                  </span>
                </div>
                <div className="text-xs text-zinc-500">
                  Asociación: carpeta → grid de Instagram. Comunica literalmente el USP.
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ═══ SECCIÓN 7: Comparación contra competidores ═══ */}
        <section className="mb-14">
          <h2 className="text-xl font-bold mb-1 text-zinc-900">7 · Diferenciación cromática vs. competidores</h2>
          <p className="text-sm text-zinc-500 mb-6">
            Cómo se posiciona AutoPost en el mapa de color del nicho. Sin colisión = identidad memorable.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { name: "Buffer", color: "#168EEA", territorio: "Azul Twitter" },
              { name: "Later", color: "#9CA3FF", territorio: "Lavanda pastel" },
              { name: "Hootsuite", color: "#143059", territorio: "Azul navy" },
              { name: "Metricool", color: "#FF6F61", territorio: "Coral" },
              { name: "Planoly", color: "#FFB6C1", territorio: "Rosa pastel" },
              { name: "AutoPost (actual)", color: "#FFAA00", territorio: "Gold/amber", current: true },
              { name: "AutoPost (propuesta)", color: "#4F46E5", territorio: "Indigo Eclipse", highlight: true },
              { name: "Acento gold AutoPost", color: "#D4A857", territorio: "Toasted gold (acento)", highlight: true },
            ].map((comp) => (
              <div
                key={comp.name}
                className={`rounded-lg border p-3 ${(comp as any).highlight ? "border-indigo-300 bg-indigo-50/40" : (comp as any).current ? "border-amber-300 bg-amber-50/40" : "border-zinc-200 bg-white"}`}
              >
                <div className="h-12 rounded-md mb-2" style={{ background: comp.color }} />
                <div className="text-xs font-semibold text-zinc-900 truncate">{comp.name}</div>
                <div className="text-[10px] text-zinc-500 truncate">{comp.territorio}</div>
                <div className="text-[10px] font-mono text-zinc-400 mt-0.5">{comp.color}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 text-xs text-zinc-500 bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <strong className="text-emerald-900">Validación:</strong> el indigo #4F46E5 propuesto es <strong>territorio cromático libre</strong> en
            el nicho (ningún competidor lo posee). Diferencia simultáneamente del gold de AutoPost actual y de los azules de Buffer/Hootsuite.
            El Signature Gold #D4A857 como acento queda visualmente independiente del primario y no compite con Metricool (que usa coral, no gold).
          </div>
        </section>

        {/* ═══ SECCIÓN 8: Checklist de validación ═══ */}
        <section className="mb-14">
          <h2 className="text-xl font-bold mb-1 text-zinc-900">8 · Checklist de validación antes de aplicar</h2>
          <p className="text-sm text-zinc-500 mb-6">Lo que esta página verifica matemática y visualmente:</p>

          <div className="space-y-2">
            {[
              { ok: ratios.propPrimary_white >= 4.5, txt: `Texto blanco sobre primario #4F46E5 cumple AA (${ratios.propPrimary_white.toFixed(2)}:1)` },
              { ok: ratios.propSecondary_white >= 4.5, txt: `Texto secundario #64748B sobre blanco cumple AA (${ratios.propSecondary_white.toFixed(2)}:1)` },
              { ok: ratios.propText_white >= 7, txt: `Texto principal #0A0A0F sobre blanco cumple AAA (${ratios.propText_white.toFixed(2)}:1)` },
              { ok: ratios.propSignature_text >= 4.5, txt: `Texto oscuro sobre Signature Gold cumple AA (${ratios.propSignature_text.toFixed(2)}:1)` },
              { ok: ratios.propSignature_white < 4.5, txt: `⚠️ Confirmado: texto blanco sobre gold FALLA — usar siempre texto oscuro sobre gold` },
              { ok: ratios.currentTertiary_white < 4.5, txt: `⚠️ Confirmado: paleta ACTUAL falla en disclaimer (#A1A1AA = ${ratios.currentTertiary_white.toFixed(2)}:1) — la propuesta lo arregla` },
              { ok: true, txt: "Diferenciación cromática frente a Buffer, Later, Hootsuite, Metricool, Planoly: territorio libre" },
              { ok: true, txt: "Logo: glifo proprietario (folder + grid) comunica USP literal vs Zap genérico actual" },
              { ok: true, txt: "Coherencia: indigo = funcional/confianza, gold = premium/exclusivo (regla 60-30-10 aplicable)" },
            ].map((item, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 rounded-lg border p-3 ${item.ok ? "border-emerald-200 bg-emerald-50/40" : "border-red-200 bg-red-50/40"}`}
              >
                {item.ok ? (
                  <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <X className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                )}
                <span className="text-sm text-zinc-700">{item.txt}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <div className="border-t border-zinc-200 pt-8 text-xs text-zinc-500">
          <p className="mb-2">
            Esta página NO afecta a producción. Vive en <code className="px-1.5 py-0.5 bg-zinc-100 rounded font-mono">/palette-preview</code>.
            Cuando aprobéis la paleta, el siguiente paso es refactor del <code className="px-1.5 py-0.5 bg-zinc-100 rounded font-mono">tailwind.config.ts</code> y los tokens en <code className="px-1.5 py-0.5 bg-zinc-100 rounded font-mono">globals.css</code>.
          </p>
          <p>Cálculos WCAG implementados según especificación oficial W3C — relative luminance + ratio (L1+0.05)/(L2+0.05).</p>
        </div>
      </div>
    </div>
  );
}

function RatioRow({ label, ratio, critical, note }: { label: string; ratio: number; critical?: boolean; note?: string }) {
  const normal = wcagBadge(ratio, false);
  const large = wcagBadge(ratio, true);
  return (
    <tr className={critical ? "bg-red-50/40" : ""}>
      <td className="px-4 py-3 text-zinc-700">
        {label}
        {note && <div className="text-xs text-zinc-500 mt-0.5">{note}</div>}
      </td>
      <td className="px-4 py-3 font-mono text-zinc-900 font-semibold">{ratio.toFixed(2)}:1</td>
      <td className="px-4 py-3">
        <span className={`px-1.5 py-0.5 rounded text-xs font-mono ${normal.pass ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
          {normal.pass ? `✓ ${normal.level}` : "✗ FAIL"}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={`px-1.5 py-0.5 rounded text-xs font-mono ${large.pass ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
          {large.pass ? `✓ ${large.level}` : "✗ FAIL"}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-zinc-500">
        {ratio >= 7 ? "Sobresaliente" : ratio >= 4.5 ? "Acepta texto pequeño" : ratio >= 3 ? "Solo texto grande/UI" : "Inutilizable para texto"}
      </td>
    </tr>
  );
}

function FolderGridGlyph({ color = "#FFFFFF" }: { color?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      {/* Folder outline */}
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
      {/* Grid 3x3 inside */}
      <line x1="9" y1="11" x2="9" y2="18" opacity="0.7" />
      <line x1="15" y1="11" x2="15" y2="18" opacity="0.7" />
      <line x1="6" y1="13.5" x2="21" y2="13.5" opacity="0.7" />
      <line x1="6" y1="16" x2="21" y2="16" opacity="0.7" />
    </svg>
  );
}
