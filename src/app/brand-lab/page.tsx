"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Folder, ArrowRight, Sparkles, Calendar, Upload, Check, X,
  Box, Layers, Anchor, Egg, Package, Inbox,
} from "lucide-react";

/* ════════════════════════════════════════════════════════════════════
   /brand-lab — Laboratorio de marca
   Tres direcciones de paleta Apple-style + nombres con logos +
   animaciones de referencia con demos en vivo.
   Standalone, no depende del design system actual.
   ════════════════════════════════════════════════════════════════════ */

/* ─── WCAG utilities ─────────────────────────────────────────────── */
function relLum(hex: string): number {
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
function ratio(a: string, b: string): number {
  const L1 = relLum(a), L2 = relLum(b);
  const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (hi + 0.05) / (lo + 0.05);
}
function pass(r: number) {
  return { aa: r >= 4.5, aaLg: r >= 3, aaa: r >= 7 };
}

/* ─── Three Apple-style palette directions ───────────────────────── */
const PALETTES = [
  {
    id: "obsidian",
    name: "Obsidian Pro",
    tagline: "MacBook Pro · iPhone Pro vibe — autoritativo, premium, masculino",
    hero: "#0A0A0B",
    heroAlt: "#1A1A1D",
    surface: "#FAFAF7",
    surfaceAlt: "#F2F2EE",
    text: "#0A0A0B",
    textOn: "#FAFAF7",
    secondary: "#52525B",
    accent: "#C9A96E",
    accentDark: "#A6864B",
    accentName: "Champán tostado",
    description:
      "Negro casi absoluto + crema cálida + acento champán muy contenido. La más premium y autoritativa, ideal si AutoPost se posiciona como herramienta Pro para agencias serias. Apple usa este lenguaje en MacBook Pro y iPhone Pro.",
    inspiration: "Apple MacBook Pro, iPhone Pro Max, Leica, Loro Piana",
  },
  {
    id: "cupertino",
    name: "Cupertino White",
    tagline: "iMac · iPad — luminosa, optimista, accesible",
    hero: "#FFFFFF",
    heroAlt: "#F5F5F7",
    surface: "#FFFFFF",
    surfaceAlt: "#F5F5F7",
    text: "#1D1D1F",
    textOn: "#1D1D1F",
    secondary: "#6E6E73",
    accent: "#0066CC",
    accentDark: "#004C99",
    accentName: "Science Blue (Apple)",
    description:
      "Athens Gray + blanco + Science Blue. La paleta literal de apple.com. Riesgo: parecer copia descarada. Mitigación: usar el blue solo en CTAs primarios y reemplazar partes de blue por un verde signature en analytics/success states.",
    inspiration: "apple.com home, MacBook Air, iPad consumer",
  },
  {
    id: "aluminum",
    name: "Aluminum Studio",
    tagline: "Apple Studio · Vision Pro — material, futurista, neutro",
    hero: "#1D1D1F",
    heroAlt: "#2C2C2E",
    surface: "#F5F5F7",
    surfaceAlt: "#E8E8ED",
    text: "#1D1D1F",
    textOn: "#F5F5F7",
    secondary: "#6E6E73",
    accent: "#86868B",
    accentDark: "#48484A",
    accentName: "Aluminum Silver",
    accentGlow: "#A8DADC",
    description:
      "Grafito + aluminio + un glow muy sutil de cobalto frío para CTAs. La más \"material\" — sensación de hardware Apple Studio. Funciona si la comunicación visual gira en torno a la interfaz como producto físico (cards con sombras profundas, dieléctricos cromados).",
    inspiration: "Apple Studio Display, Mac Studio, Vision Pro page",
  },
];

/* ─── Name candidates ────────────────────────────────────────────── */
const NAMES = [
  {
    id: "crate",
    name: "Crate",
    tagline: "La caja donde cargas tu mes de contenido",
    rationale:
      "Common word usado de manera no obvia (al estilo Stripe, Linear, Notion). Suena premium y a packaging. Comunica el mental model exacto: subes una caja, la programa por ti.",
    pros: ["1 sílaba, fácil de pronunciar en ES e EN", "Premium feel (Crate&Barrel ya validó la palabra)", "Visual: caja → calendario es metáfora directa"],
    cons: ["crate.com cogido (Crate&Barrel)", "Hay que comprar variante: getcrate.app, hellocrate.com, crate.app, crate.so"],
    domains: ["crate.app ⚠️ verificar", "getcrate.com ✓ probable", "usecrate.com ✓ probable"],
    icon: <Box className="h-full w-full" />,
    tagline_en: "A month of Instagram in a crate.",
    tagline_es: "Un mes de Instagram en una caja.",
  },
  {
    id: "bundle",
    name: "Bundle",
    tagline: "El paquete de posts que se publica solo",
    rationale:
      "Friendly, conversacional, descriptivo. \"Sube un bundle\" es algo que el usuario ya entiende sin explicación. Más cálido que Crate, menos premium-distante.",
    pros: ["Significado literal claro", "2 sílabas, escalable a cualquier tamaño", "Friendly tone — bueno para creadores"],
    cons: ["bundle.com cogido (varios)", "Compite contra términos de e-commerce \"product bundle\""],
    domains: ["bundle.app ⚠️ verificar", "trybundle.com ✓ probable", "usebundle.io ✓ probable"],
    icon: <Package className="h-full w-full" />,
    tagline_en: "A month of Instagram in one bundle.",
    tagline_es: "Tu mes de Instagram en un bundle.",
  },
  {
    id: "hatch",
    name: "Hatch",
    tagline: "Donde tu calendario eclosiona",
    rationale:
      "Verbo que se vuelve nombre — Apple-style (\"Air\", \"Vision\"). Conota acción + vida + cosa que sale lista al mundo. Memorable y único en el nicho.",
    pros: ["Verbo activo, sugiere \"to hatch a plan\"", "1 sílaba, punzante", "Único en SaaS de scheduling"],
    cons: ["hatch.com cogido (Hatch baby app)", "Ambiguo sin contexto"],
    domains: ["hatch.app ⚠️ verificar", "gethatch.com ✓ probable", "usehatch.io ✓ probable"],
    icon: <Egg className="h-full w-full" />,
    tagline_en: "Drop a folder. Hatch a month.",
    tagline_es: "Suelta una carpeta. Eclosiona un mes.",
  },
  {
    id: "pier",
    name: "Pier",
    tagline: "El muelle donde tu contenido atraca",
    rationale:
      "Premium europeo, sofisticado, raro en SaaS. Conota \"donde llegan las mercancías\". 4 letras, monosílabo, único. Riesgo: menos descriptivo de inicio.",
    pros: ["Inusual en software, alta diferenciación", "Premium tone (think Quay, Marina, Pier)", "Logo potencial fuerte (líneas verticales muelle)"],
    cons: ["Pier 1 Imports en USA — asociación retail", "Menos obvio que Crate/Bundle"],
    domains: ["pier.app ⚠️ verificar", "pierhq.com ✓ probable", "usepier.com ✓ probable"],
    icon: <Anchor className="h-full w-full" />,
    tagline_en: "Your content docks here.",
    tagline_es: "Aquí atraca tu contenido.",
  },
  {
    id: "stax",
    name: "Stax",
    tagline: "Una pila, un mes",
    rationale:
      "Spelling moderno (Vercel, Stripe, Brex). Conota \"stack of posts\". 4 letras, ultra-brief, distintivo. La x da carácter tech. Funciona muy bien para logo monogramático.",
    pros: ["Distintivo, brandable, único", "Spelling moderno y memorable", "1 sílaba, perfect para wordmark"],
    cons: ["Sin significado literal claro (necesita explicación)", "stax.com cogido (Stax Records)"],
    domains: ["stax.app ⚠️ verificar", "trystax.com ✓ probable", "stax.so ✓ probable"],
    icon: <Layers className="h-full w-full" />,
    tagline_en: "Stack. Schedule. Done.",
    tagline_es: "Apila. Programa. Listo.",
  },
  {
    id: "draft",
    name: "Draft",
    tagline: "Tus borradores, en piloto automático",
    rationale:
      "Lo que el SMM hace todo el día: \"draft posts\". Apropiación lingüística directa. Como Notion (notes) o Stripe (transactions). Muy memorable.",
    pros: ["Significado literal: lo que cargas son drafts", "Common word usado en su sentido natural", "1 sílaba, escalable, pronunciable global"],
    cons: ["draft.com cogido", "Genérico — todos hacen drafts", "Ya hay Draft.dev, Draft.app probablemente cogido"],
    domains: ["draft.so ⚠️ verificar", "drafthq.com ✓ probable", "usedraft.app ⚠️ verificar"],
    icon: <Inbox className="h-full w-full" />,
    tagline_en: "Drafts that publish themselves.",
    tagline_es: "Drafts que se publican solos.",
  },
];

/* ─── Animation references ───────────────────────────────────────── */
const MOTION_REFS = [
  {
    title: "Pinned scroll product reveal",
    src: "Apple Mac Studio / iPhone Pro page",
    desc: "Sticky container + frame-by-frame internal animations conducidas por scroll. El producto rota, se abre, se transforma a medida que avanzas. La técnica más cinematográfica de la web moderna.",
    use: "Para mostrar el flow completo: carpeta vacía → drag → posts volando al calendario → mes completo iluminado.",
    impl: "GSAP ScrollTrigger + image sequence O Framer Motion `useScroll` + `useTransform` con motion values.",
  },
  {
    title: "Magnetic CTA",
    src: "Linear, Cursor, Vercel home",
    desc: "El botón se mueve sutilmente hacia el cursor cuando se acerca (5-15px). Crea sensación táctil sin click.",
    use: "Único CTA primario del hero y final. El usuario siente el botón antes de clicar.",
    impl: "Tu MotionMagnetic actual (✓ ya está). Bajar `strength` a 0.08-0.12 para que sea sutil.",
  },
  {
    title: "Spotlight follower",
    src: "Aceternity, Vercel hero",
    desc: "Radial gradient que sigue al cursor con spring damping. Da vida al hero sin ruido.",
    use: "Único fondo del hero — eliminar Meteors actuales y dejar solo el spotlight + un noise texture sutil.",
    impl: "Tu MouseGradient actual (✓ ya está). Bajar opacidad del gradient a 0.04 para Apple-style discreción.",
  },
  {
    title: "Liquid Glass cards",
    src: "iOS 26 Liquid Glass, Apple visionOS",
    desc: "Cards con backdrop-filter blur + tinte de color del fondo + borde luminoso refractado. Material visual revolucionario de 2025.",
    use: "Todas las cards de features. Reemplazo del shadow-card actual.",
    impl: "`backdrop-filter: blur(20px) saturate(180%); background: rgba(255,255,255,0.6); border: 1px solid rgba(255,255,255,0.3);` + sutil reflejo top con gradiente lineal.",
  },
  {
    title: "Image sequence on scroll",
    src: "Apple iPhone 15 Pro page",
    desc: "Video se reproduce frame por frame controlado por la posición de scroll. El usuario siente que controla el tiempo.",
    use: "Una secuencia de 60 frames del calendario llenándose con posts.",
    impl: "60 PNG frames + `useScroll` mapeado a `currentFrame` index. Total weight ~600KB con WebP.",
  },
  {
    title: "Number ticker on viewport",
    src: "Stripe, Linear, Magic UI",
    desc: "Contador animado que va de 0 al valor real cuando entra en viewport. Genera anticipación.",
    use: "Stats: \"12.847 posts publicados\", \"47 agencias activas\", \"2.5M minutos ahorrados\".",
    impl: "Tu NumberTicker actual (✓ ya está). Curvar con `cubic-bezier(0.16, 1, 0.3, 1)` para overshoot Apple-style.",
  },
  {
    title: "Marquee with hover-pause",
    src: "Magic UI Marquee, Linear customers",
    desc: "Carrusel infinito horizontal que pausa cuando el cursor entra. Para social proof.",
    use: "Logos de clientes/agencias y testimonios.",
    impl: "Tu marquee actual (✓ ya está). Reducir velocidad a 60s/loop, gap 48px.",
  },
  {
    title: "Border beam rotating",
    src: "Aceternity BorderBeam, Magic UI",
    desc: "Borde con un beam de luz que da vueltas. Solo en el CTA final — no abusar.",
    use: "Únicamente en el CTA final \"Programar mis primeros 30 días\". Genera urgencia visual.",
    impl: "Tu BorderBeam actual (✓ ya está). Color: el accent del palette elegido + el primary.",
  },
];

type PalId = "obsidian" | "cupertino" | "aluminum";

export default function BrandLab() {
  const [activeTab, setActiveTab] = useState<"colors" | "names" | "motion">("colors");
  const [activePal, setActivePal] = useState<PalId>("obsidian");
  const palette = PALETTES.find((p) => p.id === activePal)!;

  return (
    <div className="min-h-screen bg-white text-zinc-900" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* ─── Header ─── */}
      <header className="border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">
            /brand-lab · validación pre-producción
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-950 mb-3">
            Laboratorio de marca
          </h1>
          <p className="text-zinc-600 max-w-2xl">
            Tres direcciones cromáticas Apple-style, seis candidatos a nombre y ocho referencias de motion design para validar antes de aplicar a producción.
          </p>

          {/* Tabs */}
          <div className="mt-8 inline-flex items-center gap-1 p-1 rounded-xl bg-zinc-100">
            {(["colors", "names", "motion"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                  activeTab === t ? "bg-white shadow-sm text-zinc-950" : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                {t === "colors" && "1 · Colores"}
                {t === "names" && "2 · Nombres"}
                {t === "motion" && "3 · Animaciones"}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* ═══════════════════════════════════════════════════════════
             TAB 1 · COLORES
             ═══════════════════════════════════════════════════════════ */}
        {activeTab === "colors" && (
          <div className="space-y-12">
            <div>
              <h2 className="text-2xl font-bold text-zinc-950 mb-2">Tres direcciones Apple-style</h2>
              <p className="text-sm text-zinc-600 max-w-2xl">
                Apple discipline a cumplir: máximo 3 colores en toda la marca (1 hero + 1 surface + 1 acento).
                Producto como héroe absoluto. El acento se ve en menos del 5% de los píxeles totales.
              </p>
            </div>

            {/* Selector */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {PALETTES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setActivePal(p.id as PalId)}
                  className={`text-left rounded-xl border-2 p-4 transition-all ${
                    activePal === p.id ? "border-zinc-900 bg-zinc-50" : "border-zinc-200 hover:border-zinc-400"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex">
                      <span className="h-6 w-6 rounded-l-md" style={{ background: p.hero }} />
                      <span className="h-6 w-6" style={{ background: p.surface, borderTop: "1px solid #e4e4e7", borderBottom: "1px solid #e4e4e7" }} />
                      <span className="h-6 w-6 rounded-r-md" style={{ background: p.accent }} />
                    </div>
                    {activePal === p.id && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-zinc-900 text-white ml-auto">ACTIVA</span>
                    )}
                  </div>
                  <div className="font-semibold text-zinc-950">{p.name}</div>
                  <div className="text-xs text-zinc-500">{p.tagline}</div>
                </button>
              ))}
            </div>

            {/* Hero mockup live */}
            <ApplelikeHero palette={palette} />

            {/* Description + inspiration */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-xl border border-zinc-200 p-6 bg-white">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 mb-3">Filosofía</h3>
                <p className="text-sm text-zinc-700 leading-relaxed">{palette.description}</p>
              </div>
              <div className="rounded-xl border border-zinc-200 p-6 bg-white">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 mb-3">Inspiración</h3>
                <p className="text-sm text-zinc-700 leading-relaxed">{palette.inspiration}</p>
                <div className="mt-4 grid grid-cols-3 gap-2 text-[10px] font-mono">
                  <div className="rounded p-2" style={{ background: palette.hero, color: palette.textOn }}>
                    HERO<br />{palette.hero.toUpperCase()}
                  </div>
                  <div className="rounded p-2 border border-zinc-200" style={{ background: palette.surface, color: palette.text }}>
                    SURFACE<br />{palette.surface.toUpperCase()}
                  </div>
                  <div className="rounded p-2" style={{ background: palette.accent, color: relLum(palette.accent) > 0.5 ? "#000" : "#FFF" }}>
                    ACCENT<br />{palette.accent.toUpperCase()}
                  </div>
                </div>
              </div>
            </div>

            {/* WCAG matrix */}
            <ContrastMatrix palette={palette} />

            {/* Comparison strip */}
            <div className="rounded-xl border border-zinc-200 overflow-hidden">
              <div className="px-6 py-3 bg-zinc-50 border-b border-zinc-200 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Las tres direcciones lado a lado
              </div>
              <div className="grid grid-cols-3 divide-x divide-zinc-200">
                {PALETTES.map((p) => (
                  <div key={p.id} className="p-6 flex flex-col items-center text-center" style={{ background: p.surface }}>
                    <div
                      className="h-20 w-20 rounded-2xl flex items-center justify-center mb-4"
                      style={{ background: p.hero }}
                    >
                      <Folder className="h-9 w-9" style={{ color: p.accent }} />
                    </div>
                    <div className="font-bold text-lg" style={{ color: p.text }}>
                      Stax
                    </div>
                    <div className="text-xs mt-1" style={{ color: p.secondary }}>
                      {p.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Apple disciplines reminder */}
            <div className="rounded-xl bg-zinc-950 text-white p-8">
              <h3 className="text-lg font-bold mb-4">Disciplinas Apple no negociables</h3>
              <div className="grid md:grid-cols-2 gap-x-8 gap-y-3 text-sm text-zinc-300">
                {[
                  "Máximo 3 colores en toda la marca (4º solo para success/error)",
                  "Producto = héroe absoluto. Toda animación sirve al producto.",
                  "Fonts: Satoshi/Inter ya están bien. Solo 2 weights: 500 (body) y 800 (display).",
                  "Espacio negativo es lujo — `py-24` mínimo entre secciones.",
                  "Cero superlativos. Números concretos: \"30 días\", \"2 minutos\".",
                  "Una idea por sección. Si hay dos, son dos secciones.",
                  "El acento aparece en <5% de píxeles. Si está en todo, ya no es acento.",
                  "Imagen del producto > ilustración decorativa. Siempre.",
                ].map((rule, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
             TAB 2 · NOMBRES
             ═══════════════════════════════════════════════════════════ */}
        {activeTab === "names" && (
          <div className="space-y-12">
            <div>
              <h2 className="text-2xl font-bold text-zinc-950 mb-2">Seis candidatos al nuevo nombre</h2>
              <p className="text-sm text-zinc-600 max-w-2xl">
                Confirmado: <strong>"AutoPost" está cogido</strong> por varios productos (autopost.so, AutoPostr, Autopost.io en niches similares).
                <strong>"Cadence" también está cogido</strong> en este nicho exacto (socialcadence.io). <strong>"Folio" cogido</strong> (FOLIO library system).
                Los 6 candidatos siguientes priorizan disponibilidad probable + alineación Apple.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {NAMES.map((n) => (
                <NameCard key={n.id} name={n} />
              ))}
            </div>

            <div className="rounded-xl bg-amber-50 border border-amber-200 p-6">
              <h3 className="text-sm font-bold text-amber-900 mb-2">⚠️ Próximo paso obligatorio antes de elegir</h3>
              <p className="text-sm text-amber-900 leading-relaxed mb-3">
                Verificar disponibilidad de dominios y handles sociales para los nombres preferidos en:
              </p>
              <ul className="text-sm text-amber-900 space-y-1 list-disc list-inside">
                <li><strong>Domain registrars:</strong> Namecheap, Porkbun, Cloudflare Registrar para .com / .app / .io / .so</li>
                <li><strong>Social handles:</strong> Instagram, Twitter/X, LinkedIn, TikTok, GitHub (mismo handle en todos)</li>
                <li><strong>Trademarks:</strong> EUIPO (Europa) + USPTO (USA) — clase 9 (software) y 42 (servicios SaaS)</li>
                <li><strong>App stores:</strong> aunque seáis web-only, reservar el nombre en App Store + Play Store</li>
              </ul>
            </div>

            <div className="rounded-xl border border-zinc-200 p-6 bg-white">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 mb-3">Mi recomendación</h3>
              <p className="text-sm text-zinc-700 leading-relaxed">
                <strong className="text-zinc-950">Crate</strong> es la opción más Apple-like de las seis: common word usado de forma no obvia, una sílaba, conota packaging premium, y el mental model es directo (subes una caja → ella publica). Si <code className="text-xs px-1 bg-zinc-100 rounded">crate.app</code> no está disponible, el segundo es <strong className="text-zinc-950">Hatch</strong> (verbo→nombre, action-oriented, 100% Apple-style). El tercero, <strong className="text-zinc-950">Stax</strong> si queréis un look más tech-modern (Vercel/Stripe vibe).
              </p>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
             TAB 3 · ANIMACIONES
             ═══════════════════════════════════════════════════════════ */}
        {activeTab === "motion" && (
          <div className="space-y-12">
            <div>
              <h2 className="text-2xl font-bold text-zinc-950 mb-2">Ocho referencias de motion premium 2026</h2>
              <p className="text-sm text-zinc-600 max-w-2xl">
                Curado contra Apple, Linear, Vercel, Cursor, Aceternity, Magic UI y los ganadores de Awwwards 2025-26.
                Las 4 primeras son las que recomiendo implementar en AutoPost. Las otras 4, contexto.
              </p>
            </div>

            {/* Live demos block */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 mb-4">Demos en vivo (probadlas)</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <DemoMagnetic />
                <DemoSpotlight />
                <DemoLiquidGlass />
                <DemoNumberTicker />
              </div>
            </div>

            {/* References list */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 mb-4">Catálogo completo</h3>
              <div className="space-y-3">
                {MOTION_REFS.map((ref, i) => (
                  <details key={i} className="group rounded-xl border border-zinc-200 bg-white">
                    <summary className="cursor-pointer px-5 py-4 flex items-center gap-3 hover:bg-zinc-50">
                      <span className="text-xs font-mono text-zinc-400 w-6">{String(i + 1).padStart(2, "0")}</span>
                      <span className="font-semibold text-zinc-950 flex-1">{ref.title}</span>
                      <span className="text-xs text-zinc-500 font-mono">{ref.src}</span>
                      <span className="text-zinc-400 group-open:rotate-90 transition-transform">›</span>
                    </summary>
                    <div className="px-5 pb-5 pl-14 space-y-3 text-sm">
                      <p className="text-zinc-700">{ref.desc}</p>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                          <div className="text-[10px] font-bold text-emerald-700 uppercase mb-1">Uso en AutoPost</div>
                          <div className="text-xs text-emerald-900">{ref.use}</div>
                        </div>
                        <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                          <div className="text-[10px] font-bold text-blue-700 uppercase mb-1">Implementación</div>
                          <div className="text-xs text-blue-900">{ref.impl}</div>
                        </div>
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            </div>

            {/* Hero scene proposal */}
            <div className="rounded-2xl bg-zinc-950 text-white p-8">
              <h3 className="text-xl font-bold mb-2">Escena hero propuesta — pinned scroll cinemático</h3>
              <p className="text-sm text-zinc-300 mb-6 max-w-2xl">
                Una sola animación gobierna todo el hero. Reemplaza el video decorativo actual + Meteors + GooeyText por una secuencia única que cuenta la historia del producto en 4 actos.
              </p>
              <div className="grid sm:grid-cols-4 gap-3 text-xs">
                {[
                  { act: "1", title: "Carpeta vacía", desc: "Calendario gris, slots vacíos, tipografía grande del headline encima." },
                  { act: "2", title: "Drag", desc: "Una carpeta entra desde abajo, se acerca al calendario. El cursor del usuario virtual la suelta." },
                  { act: "3", title: "Posts vuelan", desc: "Imágenes salen de la carpeta como rayos de luz y se posicionan en cada slot del calendario." },
                  { act: "4", title: "Calendario lleno", desc: "Todas las casillas iluminadas. Counter \"30 posts programados · 2 min 14 s\" aparece." },
                ].map((s) => (
                  <div key={s.act} className="rounded-lg bg-white/5 border border-white/10 p-4">
                    <div className="text-2xl font-bold text-white mb-1">{s.act}</div>
                    <div className="font-semibold text-white mb-1">{s.title}</div>
                    <div className="text-zinc-400 text-[11px]">{s.desc}</div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-zinc-400 mt-6">
                Implementación: GSAP ScrollTrigger (más performante que framer-motion para image sequences) o
                framer-motion <code className="px-1 bg-white/10 rounded text-zinc-200">useScroll</code> +
                <code className="px-1 bg-white/10 rounded text-zinc-200 ml-1">useTransform</code> con motion values.
                Peso: 60 frames WebP optimizados ≈ 600KB total. Skeleton mientras carga la primera frame.
              </p>
            </div>

            {/* What to remove */}
            <div className="rounded-xl border border-red-200 bg-red-50 p-6">
              <h3 className="text-sm font-bold text-red-900 mb-3">Quitar de la implementación actual</h3>
              <ul className="text-sm text-red-900 space-y-2">
                <li className="flex gap-2"><X className="h-4 w-4 mt-0.5 shrink-0" /> <strong>Meteors x2</strong> en hero — coste alto, valor narrativo bajo. Apple no usa partículas en hero.</li>
                <li className="flex gap-2"><X className="h-4 w-4 mt-0.5 shrink-0" /> <strong>GooeyText morphing</strong> — tipografía debe ser estática y autoritaria, no jugar.</li>
                <li className="flex gap-2"><X className="h-4 w-4 mt-0.5 shrink-0" /> <strong>Three.js + drei + maath</strong> si <code>HeroScene</code> no se ve — bundle -600KB.</li>
                <li className="flex gap-2"><X className="h-4 w-4 mt-0.5 shrink-0" /> <strong>cta-pulse infinito</strong> en CTAs — distrae, no Apple.</li>
                <li className="flex gap-2"><X className="h-4 w-4 mt-0.5 shrink-0" /> <strong>BorderBeam</strong> en cards intermedias — reservar SOLO al CTA final.</li>
                <li className="flex gap-2"><X className="h-4 w-4 mt-0.5 shrink-0" /> <strong>Marquee a 45s</strong> — demasiado rápido para leer testimonios. Subir a 60-70s.</li>
              </ul>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-zinc-200 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-8 text-xs text-zinc-500 flex flex-col sm:flex-row gap-3 justify-between">
          <span>/brand-lab — laboratorio de marca, no afecta a producción</span>
          <span>Siguiente paso: elegir paleta + nombre + verificar dominios + refactor de tokens</span>
        </div>
      </footer>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   COMPONENTS
   ════════════════════════════════════════════════════════════════════ */

function ApplelikeHero({ palette }: { palette: typeof PALETTES[0] }) {
  const isDarkHero = relLum(palette.hero) < 0.3;
  return (
    <div className="rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 bg-zinc-100 border-b border-zinc-200 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-400/60" />
        <span className="text-xs font-mono text-zinc-500 ml-3">{palette.name.toLowerCase().replace(" ", "-")}.app</span>
      </div>
      <div style={{ background: palette.surface }}>
        {/* Top nav */}
        <div className="flex items-center justify-between px-10 py-5 border-b" style={{ borderColor: relLum(palette.surface) > 0.5 ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.1)" }}>
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-md flex items-center justify-center" style={{ background: palette.hero }}>
              <Folder className="h-3.5 w-3.5" style={{ color: palette.accent }} />
            </div>
            <span className="font-bold text-base" style={{ color: palette.text }}>Stax</span>
          </div>
          <div className="flex items-center gap-5 text-sm">
            <span style={{ color: palette.secondary }}>Producto</span>
            <span style={{ color: palette.secondary }}>Precios</span>
            <button
              className="text-sm font-semibold px-4 py-2 rounded-lg"
              style={{ background: palette.hero, color: palette.textOn }}
            >
              Empezar
            </button>
          </div>
        </div>

        {/* Hero */}
        <div className="px-10 py-20 text-center">
          <div className="text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: palette.accent }}>
            Para agencias de social media
          </div>
          <h1 className="font-extrabold tracking-tight text-5xl sm:text-6xl mb-6 leading-[0.95]" style={{ color: palette.text }}>
            Un mes de Instagram.<br />
            <span style={{ color: palette.accent }}>Una carpeta.</span>
          </h1>
          <p className="text-base max-w-md mx-auto mb-10 leading-relaxed" style={{ color: palette.secondary }}>
            Suelta tu carpeta. Stax detecta carruseles, programa 30 días y publica.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              className="inline-flex items-center gap-2 text-sm font-semibold px-7 py-3.5 rounded-full"
              style={{
                background: palette.hero,
                color: palette.textOn,
                boxShadow: isDarkHero
                  ? `0 8px 24px -8px ${palette.hero}99, 0 0 0 1px ${palette.hero}`
                  : `0 8px 24px -8px rgba(0,0,0,0.4)`,
              }}
            >
              Probar gratis
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              className="text-sm font-semibold px-6 py-3.5 rounded-full border"
              style={{ borderColor: palette.secondary + "40", color: palette.text, background: "transparent" }}
            >
              Ver demo
            </button>
          </div>
        </div>

        {/* Product hero — calendar mockup */}
        <div className="px-10 pb-16">
          <div
            className="rounded-2xl mx-auto max-w-2xl p-6 backdrop-blur-xl"
            style={{
              background: relLum(palette.surface) > 0.5 ? palette.surfaceAlt : palette.heroAlt,
              border: `1px solid ${relLum(palette.surface) > 0.5 ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.1)"}`,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-semibold" style={{ color: palette.text }}>Abril 2026</div>
              <div className="flex items-center gap-2 text-xs" style={{ color: palette.secondary }}>
                <span className="h-2 w-2 rounded-full" style={{ background: palette.accent }} />
                30 posts programados
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: 30 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-md flex items-center justify-center text-[10px]"
                  style={{
                    background: i % 2 === 0 ? palette.accent + "20" : "transparent",
                    border: i % 2 === 0 ? `1px solid ${palette.accent}40` : `1px solid ${palette.secondary}20`,
                    color: palette.secondary,
                  }}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContrastMatrix({ palette }: { palette: typeof PALETTES[0] }) {
  const tests = [
    { fg: palette.textOn, bg: palette.hero, label: "Texto sobre HERO (CTA primario)", critical: true },
    { fg: palette.text, bg: palette.surface, label: "Texto sobre SURFACE (body)", critical: true },
    { fg: palette.secondary, bg: palette.surface, label: "Texto secundario sobre SURFACE", critical: true },
    { fg: palette.accent, bg: palette.surface, label: "ACCENT sobre SURFACE (eyebrows, links)" },
    { fg: palette.textOn, bg: palette.accent, label: "Texto blanco sobre ACCENT", critical: true },
    { fg: "#0A0A0B", bg: palette.accent, label: "Texto oscuro sobre ACCENT" },
  ];
  return (
    <div className="rounded-xl border border-zinc-200 overflow-hidden">
      <div className="px-6 py-3 bg-zinc-50 border-b border-zinc-200 text-xs font-semibold uppercase tracking-wider text-zinc-500">
        Validación WCAG 2.1 — {palette.name}
      </div>
      <table className="w-full text-sm">
        <thead className="text-xs uppercase text-zinc-500 bg-zinc-50/50">
          <tr>
            <th className="px-4 py-2 text-left font-semibold">Combinación</th>
            <th className="px-4 py-2 text-left font-semibold">Ejemplo</th>
            <th className="px-4 py-2 text-left font-semibold">Ratio</th>
            <th className="px-4 py-2 text-left font-semibold">AA texto</th>
            <th className="px-4 py-2 text-left font-semibold">AAA texto</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {tests.map((t, i) => {
            const r = ratio(t.fg, t.bg);
            const p = pass(r);
            return (
              <tr key={i} className={t.critical && !p.aa ? "bg-red-50/40" : ""}>
                <td className="px-4 py-3 text-zinc-700">{t.label}</td>
                <td className="px-4 py-3">
                  <span className="px-3 py-1.5 rounded-md text-sm font-semibold" style={{ background: t.bg, color: t.fg, border: "1px solid rgba(0,0,0,0.06)" }}>
                    Aa
                  </span>
                </td>
                <td className="px-4 py-3 font-mono font-semibold">{r.toFixed(2)}:1</td>
                <td className="px-4 py-3">
                  <Badge ok={p.aa} label={p.aa ? (p.aaa ? "✓ AAA" : "✓ AA") : "✗ FAIL"} />
                </td>
                <td className="px-4 py-3">
                  <Badge ok={p.aaa} label={p.aaa ? "✓ AAA" : p.aa ? "AA solo" : "✗"} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Badge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-mono font-semibold ${ok ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
      {label}
    </span>
  );
}

function NameCard({ name }: { name: typeof NAMES[0] }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden">
      {/* Logo lockup */}
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 p-8 flex items-center gap-4 relative overflow-hidden">
        <div className="h-14 w-14 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0">
          <div className="h-7 w-7">{name.icon}</div>
        </div>
        <div>
          <div className="text-3xl font-extrabold tracking-tight text-white">{name.name}</div>
          <div className="text-xs text-zinc-400 mt-0.5">{name.tagline}</div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <p className="text-sm text-zinc-700 leading-relaxed">{name.rationale}</p>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="font-semibold text-emerald-700 mb-1.5 flex items-center gap-1">
              <Check className="h-3 w-3" /> Ventajas
            </div>
            <ul className="space-y-1 text-zinc-600">
              {name.pros.map((p, i) => <li key={i}>· {p}</li>)}
            </ul>
          </div>
          <div>
            <div className="font-semibold text-amber-700 mb-1.5 flex items-center gap-1">
              <X className="h-3 w-3" /> Riesgos
            </div>
            <ul className="space-y-1 text-zinc-600">
              {name.cons.map((c, i) => <li key={i}>· {c}</li>)}
            </ul>
          </div>
        </div>

        <div className="border-t border-zinc-100 pt-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">Dominios sugeridos</div>
          <div className="flex flex-wrap gap-1.5">
            {name.domains.map((d, i) => (
              <span key={i} className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-100 text-zinc-700">{d}</span>
            ))}
          </div>
        </div>

        <div className="border-t border-zinc-100 pt-3 grid grid-cols-2 gap-3">
          <div className="text-xs">
            <div className="text-[10px] font-semibold uppercase text-zinc-500">Tagline ES</div>
            <div className="italic text-zinc-700 mt-1">"{name.tagline_es}"</div>
          </div>
          <div className="text-xs">
            <div className="text-[10px] font-semibold uppercase text-zinc-500">Tagline EN</div>
            <div className="italic text-zinc-700 mt-1">"{name.tagline_en}"</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Live demo components ───────────────────────────────────────── */

function DemoMagnetic() {
  const ref = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  function onMove(e: React.MouseEvent) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) * 0.25;
    const dy = (e.clientY - cy) * 0.25;
    setPos({ x: dx, y: dy });
  }
  function onLeave() {
    setPos({ x: 0, y: 0 });
  }

  return (
    <DemoCard title="01 · Magnetic CTA" desc="Mueve el cursor cerca del botón. Se acerca a ti.">
      <div className="h-32 flex items-center justify-center" onMouseMove={onMove} onMouseLeave={onLeave}>
        <button
          ref={ref}
          style={{
            transform: `translate(${pos.x}px, ${pos.y}px)`,
            transition: "transform 250ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
          className="px-6 py-3 rounded-full bg-zinc-950 text-white text-sm font-semibold inline-flex items-center gap-2 hover:scale-105"
        >
          Empezar gratis <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </DemoCard>
  );
}

function DemoSpotlight() {
  const [mouse, setMouse] = useState({ x: 50, y: 50 });
  return (
    <DemoCard title="02 · Spotlight follower" desc="Gradient radial que sigue al cursor.">
      <div
        className="h-32 rounded-lg relative overflow-hidden bg-zinc-100"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setMouse({
            x: ((e.clientX - rect.left) / rect.width) * 100,
            y: ((e.clientY - rect.top) / rect.height) * 100,
          });
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(400px circle at ${mouse.x}% ${mouse.y}%, rgba(201,169,110,0.35), transparent 60%)`,
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-zinc-500 text-sm">
          Mueve el cursor por aquí
        </div>
      </div>
    </DemoCard>
  );
}

function DemoLiquidGlass() {
  return (
    <DemoCard title="03 · Liquid Glass card" desc="Backdrop blur + tinte translúcido (estilo iOS 26).">
      <div
        className="h-32 rounded-lg relative overflow-hidden flex items-center justify-center p-4"
        style={{
          background: "linear-gradient(135deg, #FB923C, #EC4899, #6366F1)",
        }}
      >
        <div
          className="rounded-xl px-5 py-4 text-zinc-950"
          style={{
            background: "rgba(255,255,255,0.6)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            border: "1px solid rgba(255,255,255,0.4)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.6)",
          }}
        >
          <div className="text-xs font-semibold mb-0.5">30 posts programados</div>
          <div className="text-xs text-zinc-700">Próximo: hoy 18:00</div>
        </div>
      </div>
    </DemoCard>
  );
}

function DemoNumberTicker() {
  const [n, setN] = useState(0);
  const target = 12847;
  useEffect(() => {
    const start = performance.now();
    const dur = 2000;
    let raf: number;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.floor(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <DemoCard title="04 · Number ticker" desc="Counter de 0 al valor real con easing.">
      <div className="h-32 flex flex-col items-center justify-center">
        <div className="text-5xl font-extrabold tracking-tight text-zinc-950 tabular-nums">
          {n.toLocaleString("es-ES")}
        </div>
        <div className="text-xs text-zinc-500 mt-2">posts publicados con Stax</div>
      </div>
    </DemoCard>
  );
}

function DemoCard({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-100">
        <div className="font-semibold text-sm text-zinc-950">{title}</div>
        <div className="text-xs text-zinc-500">{desc}</div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
