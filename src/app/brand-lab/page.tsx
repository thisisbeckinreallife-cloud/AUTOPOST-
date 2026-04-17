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
  {
    title: "Logo → nav transformation on scroll",
    src: "Trend 2026 (Awwwards), Tobi Lutke site",
    desc: "El logo grande del hero se contrae y morpha en la navbar al scrollear. Identidad visual con motion.",
    use: "El wordmark Hatch grande del hero se transforma en el logo de 32px de la nav cuando se hace scroll.",
    impl: "framer-motion `useScroll` + `useTransform` sobre `scale`, `x`, `y` del wordmark. ScrollTrigger en `useMotionValueEvent`.",
  },
  {
    title: "Oversized typography vs solid backdrop",
    src: "Trend 2026, Vercel ship pages",
    desc: "Tipografía gigante (clamp 6vw a 12vw) sobre fondo sólido. Cero ornamento. Letra como protagonista.",
    use: "Hero headline \"Drop a folder. Hatch a month.\" en font-size masivo, sin badges ni ilustraciones encima.",
    impl: "`font-size: clamp(3rem, 10vw, 9rem); letter-spacing: -0.04em; line-height: 0.9;` sobre fondo `#1D1D1F` o `#F5F5F7`.",
  },
  {
    title: "Frosted Liquid Glass nav",
    src: "iOS 26, macOS Tahoe, Apple Vision",
    desc: "Navbar con backdrop blur saturate 180% + borde luminoso. El fondo se ve atravesado.",
    use: "Sticky nav de Hatch — al scroll baja opacidad del fondo blanco, el backdrop blur revela el contenido detrás.",
    impl: "`background: rgba(245,245,247,0.72); backdrop-filter: blur(24px) saturate(180%);` + transición de `border-bottom` al scrollear.",
  },
  {
    title: "Scroll-driven SVG path stroke",
    src: "Stripe, Linear changelog",
    desc: "Una línea SVG se dibuja a medida que scrolleas — conecta secciones como un hilo narrativo.",
    use: "Conectar los 3 pasos del \"Cómo funciona\" con una línea aluminum animada que se traza al scroll.",
    impl: "SVG `<path>` con `strokeDasharray` + `strokeDashoffset` controlados por `useScroll`.",
  },
  {
    title: "Spring elastic feedback",
    src: "Apple iOS interactions, Raycast",
    desc: "Cuando el usuario clica, el elemento hace un overshoot sutil (scale 0.96 → 1.04 → 1). Físico.",
    use: "TODOS los botones de Hatch. Reemplazar el `active:scale-[0.97]` actual por spring con overshoot.",
    impl: "framer-motion `<motion.button whileTap={{ scale: 0.96 }} transition={{ type: 'spring', stiffness: 400, damping: 17 }}>`.",
  },
  {
    title: "Aurora gradient drift",
    src: "Stripe homepage 2024-26, Vercel",
    desc: "Gradiente difuso que se mueve lentamente como aurora boreal. Sutil, no distractivo.",
    use: "Background del hero como reemplazo del video actual. Tinte cobalt #A8DADC al 8% de opacidad.",
    impl: "CSS gradient con `background-size: 200% 200%; animation: aurora 30s ease infinite;` + dos capas con blend mode soft-light.",
  },
];

/* ─── Component library sources ──────────────────────────────────── */
const TEMPLATE_SOURCES = [
  {
    name: "Aceternity UI",
    url: "https://ui.aceternity.com",
    desc: "200+ componentes free + 100 premium blocks. Específicos para Apple-aesthetic con framer-motion. Pro: $199 lifetime.",
    fit: "Spotlight, BorderBeam, Cards 3D, Bento Grid, Hero Highlight — todos pegan con Aluminum.",
    badge: "Recomendado",
  },
  {
    name: "Magic UI",
    url: "https://magicui.design",
    desc: "150+ componentes animados free. Compañero perfecto de shadcn/ui. Marquee, NumberTicker, AnimatedBeam.",
    fit: "AnimatedList, Marquee, NumberTicker, OrbitingCircles para mostrar el ecosistema Meta.",
    badge: "Recomendado",
  },
  {
    name: "React Bits",
    url: "https://www.reactbits.dev",
    desc: "#2 en JS Rising Stars 2025. Animaciones premium con CSS puro cuando es posible (más performante).",
    fit: "Text effects, scroll reveals, animated backgrounds — los text effects son superiores a los demás.",
    badge: "Top text effects",
  },
  {
    name: "ogblocks",
    url: "https://ogblocks.dev",
    desc: "Premium library de bloques completos con framer-motion. Hero, pricing cards, bento grids interactivos.",
    fit: "Bloques completos listos para SaaS premium. Animated pricing cards encajan perfecto con Aluminum.",
  },
  {
    name: "Framer Marketplace",
    url: "https://www.framer.com/marketplace",
    desc: "2.000+ templates. Los SaaS templates premium tienen patrones que convierten 52% mejor (CRO incluido).",
    fit: "Buscar templates con tag \"minimal + dark + premium\". Fram.AI y Saatosa son referencias.",
  },
  {
    name: "Awwwards Scroll Collections",
    url: "https://www.awwwards.com/inspiration/scroll-animations",
    desc: "Curaduría diaria de las webs ganadoras. La sección \"minimal\" + \"GSAP\" tiene oro puro.",
    fit: "Inspiración pura para hero scenes cinemáticas. Categoría \"product page\" para layouts.",
  },
];

type PalId = "obsidian" | "cupertino" | "aluminum";

export default function BrandLab() {
  const [activeTab, setActiveTab] = useState<"colors" | "names" | "motion" | "templates">("templates");
  const [activePal, setActivePal] = useState<PalId>("aluminum");
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
            {(["templates", "colors", "names", "motion"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                  activeTab === t ? "bg-white shadow-sm text-zinc-950" : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                {t === "templates" && "★ Plantillas Hatch"}
                {t === "colors" && "Colores"}
                {t === "names" && "Nombres"}
                {t === "motion" && "Animaciones"}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* ═══════════════════════════════════════════════════════════
             TAB ★ · PLANTILLAS HATCH (Aluminum Studio aplicado)
             ═══════════════════════════════════════════════════════════ */}
        {activeTab === "templates" && (
          <div className="space-y-16">
            <div>
              <div className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">
                Hatch · Aluminum Studio · live preview
              </div>
              <h2 className="text-2xl font-bold text-zinc-950 mb-2">Bloques completos listos para usar</h2>
              <p className="text-sm text-zinc-600 max-w-2xl">
                Cada bloque aplica el nombre <strong>Hatch</strong>, la paleta <strong>Aluminum Studio</strong> y las animaciones recomendadas.
                Mira, interactúa, copia el patrón. Diseñados para encajar con el stack actual (Next.js + framer-motion + Tailwind).
              </p>
            </div>

            <TemplateBlock id="01" title="Hero — oversized typography + magnetic CTA + spotlight">
              <HatchHero />
            </TemplateBlock>

            <TemplateBlock id="02" title="Bento grid — 6 features con liquid glass + hover scale">
              <HatchBento />
            </TemplateBlock>

            <TemplateBlock id="03" title="Stats strip — 4 number tickers con eyebrow aluminum">
              <HatchStats />
            </TemplateBlock>

            <TemplateBlock id="04" title="Pricing — 3 tiers con tier central destacado (border beam)">
              <HatchPricing />
            </TemplateBlock>

            <TemplateBlock id="05" title="Testimonios — marquee infinito, hover-pause, aluminum cards">
              <HatchMarquee />
            </TemplateBlock>

            <TemplateBlock id="06" title="CTA final — magnetic + border beam aluminum">
              <HatchFinalCTA />
            </TemplateBlock>

            <TemplateBlock id="07" title="Footer — minimal dark aluminum">
              <HatchFooter />
            </TemplateBlock>

            {/* Sources */}
            <div>
              <h3 className="text-lg font-bold text-zinc-950 mb-1">Librerías recomendadas para componentes adicionales</h3>
              <p className="text-sm text-zinc-600 mb-6">Sourced de los rankings 2026 — copy-paste compatible con tu stack actual.</p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {TEMPLATE_SOURCES.map((s) => (
                  <a
                    key={s.name}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-xl border border-zinc-200 bg-white p-5 hover:border-zinc-400 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-zinc-950">{s.name}</div>
                      {s.badge && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                          {s.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-600 leading-relaxed mb-3">{s.desc}</p>
                    {s.fit && (
                      <div className="text-xs text-zinc-500 italic border-t border-zinc-100 pt-3">
                        <strong className="not-italic text-zinc-700">Para Hatch:</strong> {s.fit}
                      </div>
                    )}
                  </a>
                ))}
              </div>
            </div>

            {/* Decision summary */}
            <div className="rounded-2xl border-2 border-zinc-900 bg-zinc-900 text-white p-8">
              <div className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3">
                Decisión confirmada
              </div>
              <h3 className="text-2xl font-bold mb-4">Hatch · Aluminum Studio</h3>
              <div className="grid sm:grid-cols-3 gap-6 text-sm">
                <div>
                  <div className="text-[10px] font-semibold uppercase text-zinc-500 mb-2">Nombre</div>
                  <div className="font-semibold mb-1">Hatch</div>
                  <div className="text-zinc-400 text-xs">Drop a folder. Hatch a month.</div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase text-zinc-500 mb-2">Paleta</div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="h-4 w-4 rounded" style={{ background: "#1D1D1F" }} />
                    <span className="h-4 w-4 rounded" style={{ background: "#F5F5F7" }} />
                    <span className="h-4 w-4 rounded" style={{ background: "#86868B" }} />
                    <span className="h-4 w-4 rounded" style={{ background: "#A8DADC" }} />
                  </div>
                  <div className="text-zinc-400 text-xs">Graphite · Athens · Silver · Cobalt glow</div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase text-zinc-500 mb-2">Próximos pasos</div>
                  <ul className="text-zinc-400 text-xs space-y-1">
                    <li>1. Verificar dominios hatch.app / gethatch.com</li>
                    <li>2. Refactor tokens tailwind.config.ts</li>
                    <li>3. Aplicar plantillas a landing real</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

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

/* ════════════════════════════════════════════════════════════════════
   HATCH TEMPLATES — Aluminum Studio palette aplicada
   ════════════════════════════════════════════════════════════════════ */

const HATCH = {
  graphite: "#1D1D1F",
  graphiteAlt: "#2C2C2E",
  athens: "#F5F5F7",
  athensAlt: "#E8E8ED",
  silver: "#86868B",
  silverDark: "#48484A",
  cobalt: "#A8DADC",
  cobaltDeep: "#7DBCBE",
  textOnDark: "#F5F5F7",
  textSecondary: "#86868B",
};

function TemplateBlock({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-baseline gap-3 mb-4">
        <span className="text-xs font-mono text-zinc-400">{id}</span>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-700">{title}</h3>
      </div>
      <div className="rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
        {children}
      </div>
    </section>
  );
}

/* ─── 01 · Hero ───────────────────────────────────────────────────── */
function HatchHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);
  const [mouse, setMouse] = useState({ x: 50, y: 50 });
  const [ctaPos, setCtaPos] = useState({ x: 0, y: 0 });

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden"
      style={{ background: HATCH.athens }}
      onMouseMove={(e) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        setMouse({
          x: ((e.clientX - rect.left) / rect.width) * 100,
          y: ((e.clientY - rect.top) / rect.height) * 100,
        });
        if (ctaRef.current) {
          const r = ctaRef.current.getBoundingClientRect();
          const cx = r.left + r.width / 2;
          const cy = r.top + r.height / 2;
          const dx = e.clientX - cx;
          const dy = e.clientY - cy;
          const dist = Math.hypot(dx, dy);
          if (dist < 200) {
            setCtaPos({ x: dx * 0.15, y: dy * 0.15 });
          } else {
            setCtaPos({ x: 0, y: 0 });
          }
        }
      }}
      onMouseLeave={() => setCtaPos({ x: 0, y: 0 })}
    >
      {/* Aurora cobalt glow follower */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-700"
        style={{
          background: `radial-gradient(800px circle at ${mouse.x}% ${mouse.y}%, ${HATCH.cobalt}26, transparent 60%)`,
        }}
      />
      {/* Frosted nav */}
      <nav
        className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-8 py-4"
        style={{
          background: `rgba(245,245,247,0.72)`,
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="h-7 w-7 rounded-md flex items-center justify-center"
            style={{ background: HATCH.graphite }}
          >
            <Egg className="h-3.5 w-3.5" style={{ color: HATCH.cobalt }} />
          </div>
          <span className="font-bold text-base" style={{ color: HATCH.graphite, letterSpacing: "-0.01em" }}>
            Hatch
          </span>
        </div>
        <div className="flex items-center gap-5 text-sm">
          <span style={{ color: HATCH.silverDark }}>Producto</span>
          <span style={{ color: HATCH.silverDark }}>Precios</span>
          <button
            className="text-sm font-semibold px-4 py-2 rounded-full"
            style={{ background: HATCH.graphite, color: HATCH.textOnDark }}
          >
            Probar gratis
          </button>
        </div>
      </nav>

      {/* Hero content */}
      <div className="relative z-10 px-8 pt-32 pb-24 text-center">
        <div
          className="text-xs font-semibold uppercase tracking-[0.25em] mb-8 inline-block px-3 py-1 rounded-full"
          style={{ color: HATCH.silverDark, background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.06)" }}
        >
          Para social media managers
        </div>
        <h1
          className="font-extrabold tracking-tight mb-8"
          style={{
            color: HATCH.graphite,
            fontSize: "clamp(3rem, 9vw, 7rem)",
            lineHeight: "0.92",
            letterSpacing: "-0.045em",
          }}
        >
          Drop a folder.<br />
          <span style={{ color: HATCH.silver }}>Hatch a month.</span>
        </h1>
        <p className="text-base sm:text-lg max-w-md mx-auto mb-10 leading-relaxed" style={{ color: HATCH.silverDark }}>
          Suelta tu carpeta. Hatch detecta carruseles, programa 30 días y publica.
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            ref={ctaRef}
            style={{
              transform: `translate(${ctaPos.x}px, ${ctaPos.y}px)`,
              transition: "transform 250ms cubic-bezier(0.16, 1, 0.3, 1)",
              background: HATCH.graphite,
              color: HATCH.textOnDark,
              boxShadow: `0 12px 32px -12px rgba(29,29,31,0.6), 0 0 0 1px ${HATCH.graphite}`,
            }}
            className="inline-flex items-center gap-2 text-sm font-semibold px-7 py-3.5 rounded-full hover:scale-[1.03] active:scale-[0.97]"
          >
            Probar Hatch — gratis
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            className="text-sm font-semibold px-6 py-3.5 rounded-full border hover:bg-white/40 transition-colors"
            style={{ borderColor: "rgba(0,0,0,0.12)", color: HATCH.graphite }}
          >
            Ver demo de 90s
          </button>
        </div>
        <div className="text-xs mt-6" style={{ color: HATCH.silver }}>
          Plan gratis · Sin tarjeta · API oficial de Meta
        </div>

        {/* Product hero — calendar */}
        <div className="mt-16 relative">
          <div
            className="rounded-2xl mx-auto max-w-2xl p-6 relative"
            style={{
              background: "rgba(255,255,255,0.7)",
              backdropFilter: "blur(20px) saturate(180%)",
              WebkitBackdropFilter: "blur(20px) saturate(180%)",
              border: "1px solid rgba(255,255,255,0.6)",
              boxShadow: "0 24px 64px -16px rgba(29,29,31,0.16), inset 0 1px 0 rgba(255,255,255,0.8)",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-semibold" style={{ color: HATCH.graphite }}>Abril 2026</div>
              <div className="flex items-center gap-2 text-xs" style={{ color: HATCH.silverDark }}>
                <span className="h-2 w-2 rounded-full" style={{ background: HATCH.cobaltDeep }} />
                30 posts programados
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: 30 }).map((_, i) => {
                const filled = i < 27;
                return (
                  <div
                    key={i}
                    className="aspect-square rounded-md flex items-center justify-center text-[10px] font-medium"
                    style={{
                      background: filled ? `${HATCH.cobalt}33` : "transparent",
                      border: filled ? `1px solid ${HATCH.cobalt}66` : `1px solid ${HATCH.silver}30`,
                      color: filled ? HATCH.silverDark : HATCH.silver,
                    }}
                  >
                    {i + 1}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── 02 · Bento grid ─────────────────────────────────────────────── */
function HatchBento() {
  const cells = [
    { icon: <Folder className="h-5 w-5" />, title: "Detección de carpetas", desc: "Sube ZIP o carpeta. Hatch entiende la estructura.", size: "large" },
    { icon: <Layers className="h-5 w-5" />, title: "Carruseles automáticos", desc: "Sin numerar fotos. Hatch agrupa.", size: "small" },
    { icon: <Calendar className="h-5 w-5" />, title: "30 días en 1 click", desc: "Programación masiva.", size: "small" },
    { icon: <Sparkles className="h-5 w-5" />, title: "Posts colaborativos", desc: "Aparece en dos feeds a la vez. Sin coordinación manual.", size: "large", highlight: true },
    { icon: <Upload className="h-5 w-5" />, title: "Reels + fotos", desc: "Hasta 100MB.", size: "small" },
  ];
  return (
    <div className="p-8" style={{ background: HATCH.athens }}>
      <div className="text-xs font-semibold uppercase tracking-[0.25em] mb-3 text-center" style={{ color: HATCH.silverDark }}>
        Lo que harás (y lo que ya nunca harás)
      </div>
      <h3
        className="text-center font-extrabold tracking-tight mb-12"
        style={{ color: HATCH.graphite, fontSize: "clamp(1.75rem, 4vw, 2.5rem)", letterSpacing: "-0.03em", lineHeight: "1.05" }}
      >
        Una carpeta. Un mes. Cero clicks.
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-4xl mx-auto">
        {cells.map((cell, i) => (
          <BentoCell key={i} {...cell} />
        ))}
      </div>
    </div>
  );
}

function BentoCell({ icon, title, desc, size, highlight }: any) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={`relative rounded-2xl p-6 transition-all duration-500 cursor-pointer ${size === "large" ? "sm:col-span-2 sm:row-span-1" : ""}`}
      style={{
        background: highlight
          ? `linear-gradient(135deg, ${HATCH.graphite} 0%, ${HATCH.graphiteAlt} 100%)`
          : "rgba(255,255,255,0.7)",
        backdropFilter: "blur(16px) saturate(180%)",
        WebkitBackdropFilter: "blur(16px) saturate(180%)",
        border: highlight ? `1px solid ${HATCH.silver}40` : `1px solid rgba(255,255,255,0.6)`,
        boxShadow: hover
          ? `0 16px 40px -12px ${highlight ? "rgba(168,218,220,0.3)" : "rgba(29,29,31,0.18)"}, 0 0 0 1px ${highlight ? HATCH.cobalt + "40" : "rgba(0,0,0,0.06)"}`
          : `0 4px 12px -4px rgba(29,29,31,0.06), inset 0 1px 0 rgba(255,255,255,0.8)`,
        transform: hover ? "translateY(-2px)" : "translateY(0)",
        color: highlight ? HATCH.textOnDark : HATCH.graphite,
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div
          className="h-9 w-9 rounded-lg flex items-center justify-center"
          style={{
            background: highlight ? `${HATCH.cobalt}22` : `${HATCH.graphite}10`,
            color: highlight ? HATCH.cobalt : HATCH.graphite,
          }}
        >
          {icon}
        </div>
        {highlight && (
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: HATCH.cobalt, color: HATCH.graphite }}
          >
            ÚNICO
          </span>
        )}
      </div>
      <h4 className="font-semibold text-base mb-1.5" style={{ letterSpacing: "-0.01em" }}>
        {title}
      </h4>
      <p className="text-sm leading-relaxed" style={{ color: highlight ? HATCH.textOnDark + "B0" : HATCH.silverDark }}>
        {desc}
      </p>
    </div>
  );
}

/* ─── 03 · Stats strip ────────────────────────────────────────────── */
function HatchStats() {
  const stats = [
    { value: 12847, label: "posts publicados", suffix: "" },
    { value: 47, label: "agencias activas", suffix: "" },
    { value: 2.5, label: "millones de minutos ahorrados", suffix: "M" },
    { value: 99.8, label: "uptime últimos 90 días", suffix: "%" },
  ];
  return (
    <div className="px-8 py-16" style={{ background: HATCH.athens, borderTop: "1px solid rgba(0,0,0,0.06)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
        {stats.map((s, i) => (
          <StatItem key={i} {...s} />
        ))}
      </div>
    </div>
  );
}

function StatItem({ value, label, suffix }: { value: number; label: string; suffix: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const dur = 2000;
    let raf: number;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(value * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  const display = value < 100 && !Number.isInteger(value) ? n.toFixed(1) : Math.floor(n).toLocaleString("es-ES");
  return (
    <div className="text-center">
      <div
        className="text-4xl sm:text-5xl font-extrabold tabular-nums"
        style={{ color: HATCH.graphite, letterSpacing: "-0.03em" }}
      >
        {display}
        <span style={{ color: HATCH.cobaltDeep }}>{suffix}</span>
      </div>
      <div className="text-xs mt-2 uppercase tracking-wider" style={{ color: HATCH.silver }}>
        {label}
      </div>
    </div>
  );
}

/* ─── 04 · Pricing 3-tier ─────────────────────────────────────────── */
function HatchPricing() {
  return (
    <div className="px-8 py-16" style={{ background: HATCH.athens }}>
      <div className="text-center mb-12">
        <div className="text-xs font-semibold uppercase tracking-[0.25em] mb-3" style={{ color: HATCH.silverDark }}>
          Precios
        </div>
        <h3
          className="font-extrabold tracking-tight"
          style={{ color: HATCH.graphite, fontSize: "clamp(1.75rem, 4vw, 2.5rem)", letterSpacing: "-0.03em" }}
        >
          Empieza gratis. Crece a tu ritmo.
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
        <PricingCard
          name="Free"
          price="0"
          desc="Para probar Hatch"
          features={["1 cuenta IG", "10 posts/mes", "API oficial Meta", "Soporte comunidad"]}
        />
        <PricingCard
          name="Pro"
          price="19"
          desc="Para creators activos"
          features={["3 cuentas IG", "Posts ilimitados", "Carruseles automáticos", "Posts colaborativos", "Soporte prioritario"]}
          highlight
        />
        <PricingCard
          name="Agency"
          price="79"
          desc="Para agencias"
          features={["20 cuentas IG", "Todo de Pro", "Multi-equipo", "API access", "Account manager"]}
        />
      </div>
    </div>
  );
}

function PricingCard({ name, price, desc, features, highlight }: any) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="relative rounded-2xl p-7 transition-all duration-500"
      style={{
        background: highlight ? HATCH.graphite : "rgba(255,255,255,0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: highlight
          ? `1px solid ${HATCH.silver}50`
          : `1px solid rgba(0,0,0,0.06)`,
        color: highlight ? HATCH.textOnDark : HATCH.graphite,
        boxShadow: highlight
          ? `0 24px 64px -16px rgba(168,218,220,0.25), 0 0 0 1px ${HATCH.cobalt}30, inset 0 1px 0 rgba(255,255,255,0.06)`
          : hover
            ? `0 12px 32px -8px rgba(29,29,31,0.12)`
            : `0 2px 8px -2px rgba(29,29,31,0.04)`,
        transform: hover && !highlight ? "translateY(-2px)" : "translateY(0)",
      }}
    >
      {/* Animated border beam — only on highlighted */}
      {highlight && (
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background: `conic-gradient(from 0deg, transparent 0%, ${HATCH.cobalt}40 25%, transparent 50%, ${HATCH.cobalt}40 75%, transparent 100%)`,
            animation: "spin 8s linear infinite",
            opacity: 0.6,
            mask: "linear-gradient(#000, #000) content-box, linear-gradient(#000, #000)",
            WebkitMask: "linear-gradient(#000, #000) content-box, linear-gradient(#000, #000)",
            maskComposite: "exclude",
            WebkitMaskComposite: "xor",
            padding: "1px",
          }}
        />
      )}
      <div className="relative">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold" style={{ letterSpacing: "-0.01em" }}>{name}</span>
          {highlight && (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: HATCH.cobalt, color: HATCH.graphite }}
            >
              POPULAR
            </span>
          )}
        </div>
        <div className="text-xs mb-5" style={{ color: highlight ? HATCH.textOnDark + "80" : HATCH.silverDark }}>
          {desc}
        </div>
        <div className="flex items-baseline gap-1 mb-6">
          <span className="text-5xl font-extrabold tabular-nums" style={{ letterSpacing: "-0.04em" }}>
            €{price}
          </span>
          <span className="text-xs" style={{ color: highlight ? HATCH.textOnDark + "70" : HATCH.silver }}>
            /mes
          </span>
        </div>
        <button
          className="w-full text-sm font-semibold px-4 py-3 rounded-full mb-6 transition-all hover:scale-[1.02] active:scale-[0.97]"
          style={{
            background: highlight ? HATCH.cobalt : HATCH.graphite,
            color: highlight ? HATCH.graphite : HATCH.textOnDark,
            boxShadow: highlight ? `0 8px 20px -4px ${HATCH.cobalt}66` : "none",
          }}
        >
          Empezar con {name}
        </button>
        <ul className="space-y-2 text-sm">
          {features.map((f: string, i: number) => (
            <li key={i} className="flex items-start gap-2">
              <Check className="h-4 w-4 shrink-0 mt-0.5" style={{ color: highlight ? HATCH.cobalt : HATCH.silverDark }} />
              <span style={{ color: highlight ? HATCH.textOnDark + "DD" : HATCH.graphite }}>{f}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ─── 05 · Marquee testimonials ────────────────────────────────────── */
function HatchMarquee() {
  const testimonials = [
    { quote: "Tres horas de trabajo en cinco minutos. No exagero.", name: "Marina L.", role: "Agencia Pulso" },
    { quote: "Posts colaborativos automáticos. Game changer.", name: "Lucía M.", role: "BrandUp Studio" },
    { quote: "Subí mi carpeta de Drive y se programó solo.", name: "Diego S.", role: "@diegoviaja" },
    { quote: "Gestionamos 12 cuentas. Sin Hatch no podríamos.", name: "Carla F.", role: "SocialCraft" },
    { quote: "El plan Agency se pagó solo el primer mes.", name: "Pablo T.", role: "@foodie.madrid" },
  ];
  const [paused, setPaused] = useState(false);
  return (
    <div className="py-16 overflow-hidden" style={{ background: HATCH.athens }}>
      <div className="text-center mb-10 px-8">
        <div className="text-xs font-semibold uppercase tracking-[0.25em] mb-3" style={{ color: HATCH.silverDark }}>
          Testimonios
        </div>
        <h3 className="font-extrabold tracking-tight" style={{ color: HATCH.graphite, fontSize: "clamp(1.75rem, 4vw, 2.5rem)", letterSpacing: "-0.03em" }}>
          Lo que dicen quienes ya usan Hatch
        </h3>
      </div>
      <div
        className="flex gap-4 w-max"
        style={{
          animation: `marquee 50s linear infinite`,
          animationPlayState: paused ? "paused" : "running",
        }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {[...testimonials, ...testimonials].map((t, i) => (
          <div
            key={i}
            className="rounded-2xl p-6 shrink-0"
            style={{
              width: 320,
              background: "rgba(255,255,255,0.85)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid rgba(0,0,0,0.06)",
              boxShadow: "0 4px 16px -4px rgba(29,29,31,0.06)",
            }}
          >
            <p className="text-sm leading-relaxed mb-4" style={{ color: HATCH.graphite }}>
              "{t.quote}"
            </p>
            <div className="flex items-center gap-3">
              <div
                className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: HATCH.cobalt, color: HATCH.graphite }}
              >
                {t.name[0]}
              </div>
              <div>
                <div className="text-xs font-semibold" style={{ color: HATCH.graphite }}>{t.name}</div>
                <div className="text-xs" style={{ color: HATCH.silver }}>{t.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}} />
    </div>
  );
}

/* ─── 06 · Final CTA with border beam ─────────────────────────────── */
function HatchFinalCTA() {
  const [hover, setHover] = useState(false);
  return (
    <div className="px-8 py-24 flex items-center justify-center" style={{ background: HATCH.athens }}>
      <div
        className="relative rounded-3xl p-12 max-w-2xl w-full text-center overflow-hidden"
        style={{
          background: HATCH.graphite,
          color: HATCH.textOnDark,
          border: `1px solid ${HATCH.silver}30`,
          boxShadow: `0 32px 64px -24px rgba(29,29,31,0.4), 0 0 0 1px ${HATCH.silver}20`,
        }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        {/* Border beam */}
        <div
          className="absolute inset-0 rounded-3xl pointer-events-none"
          style={{
            background: `conic-gradient(from 0deg, transparent 0%, ${HATCH.cobalt} 15%, transparent 30%, transparent 65%, ${HATCH.silver} 85%, transparent 100%)`,
            animation: "spin 6s linear infinite",
            opacity: hover ? 0.8 : 0.4,
            mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
            WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
            maskComposite: "exclude",
            WebkitMaskComposite: "xor",
            padding: "1.5px",
            transition: "opacity 400ms ease",
          }}
        />
        {/* Aurora glow */}
        <div
          className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${HATCH.cobalt}40 0%, transparent 70%)`,
            filter: "blur(60px)",
          }}
        />
        <div className="relative">
          <h3
            className="font-extrabold tracking-tight mb-4"
            style={{ fontSize: "clamp(1.75rem, 4.5vw, 2.75rem)", letterSpacing: "-0.035em", lineHeight: "1.05" }}
          >
            Drop a folder.<br />
            <span style={{ color: HATCH.cobalt }}>Hatch a month.</span>
          </h3>
          <p className="text-sm mb-8 max-w-md mx-auto" style={{ color: HATCH.textOnDark + "B0" }}>
            Mientras tú duermes, Hatch publica. Programa 30 días en 2 minutos.
          </p>
          <button
            className="inline-flex items-center gap-2 text-sm font-semibold px-8 py-4 rounded-full hover:scale-[1.04] active:scale-[0.97] transition-all"
            style={{
              background: HATCH.cobalt,
              color: HATCH.graphite,
              boxShadow: `0 12px 32px -8px ${HATCH.cobalt}80`,
            }}
          >
            Empezar gratis — primera carpeta incluida
            <ArrowRight className="h-4 w-4" />
          </button>
          <div className="text-xs mt-4" style={{ color: HATCH.silver }}>
            Sin tarjeta de crédito · Sin compromisos
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── 07 · Footer ─────────────────────────────────────────────────── */
function HatchFooter() {
  return (
    <div style={{ background: HATCH.graphite, color: HATCH.textOnDark }}>
      <div className="px-8 py-16">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 max-w-5xl mx-auto">
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div
                className="h-7 w-7 rounded-md flex items-center justify-center"
                style={{ background: HATCH.cobalt }}
              >
                <Egg className="h-3.5 w-3.5" style={{ color: HATCH.graphite }} />
              </div>
              <span className="font-bold text-base" style={{ letterSpacing: "-0.01em" }}>Hatch</span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: HATCH.silver }}>
              Hecho en Madrid para agencias hispanohablantes.
            </p>
          </div>
          {[
            { title: "Producto", links: ["Features", "Precios", "Demo", "Roadmap"] },
            { title: "Recursos", links: ["Blog", "Templates", "Status", "Soporte"] },
            { title: "Compañía", links: ["Sobre", "Privacidad", "Términos", "Contacto"] },
          ].map((col) => (
            <div key={col.title}>
              <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: HATCH.silver }}>
                {col.title}
              </div>
              <ul className="space-y-2 text-sm">
                {col.links.map((l) => (
                  <li key={l}>
                    <a className="hover:text-white transition-colors" style={{ color: HATCH.textOnDark + "B0" }}>{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3" style={{ borderColor: HATCH.silver + "20" }}>
        <span className="text-xs" style={{ color: HATCH.silver }}>© 2026 Hatch. Todos los derechos reservados.</span>
        <span className="text-xs" style={{ color: HATCH.silver }}>API oficial de Meta · GDPR compliant · AES-256</span>
      </div>
    </div>
  );
}
