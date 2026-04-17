"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  motion,
  useTransform,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  type MotionValue,
} from "framer-motion";
import { ArrowRight, Egg } from "lucide-react";
import { FolderAsset } from "./hatch/folder-asset";
import { PostTile } from "./hatch/post-tile";
import { CalendarGrid } from "./hatch/calendar-grid";
import { useActProgress } from "./hatch/use-act-progress";
import { MotionMagnetic, BorderBeam, NumberTicker } from "@/components/motion";

/* ═════════════════════════════════════════════════════════════════════
   HatchHero — pinned scroll cinematográfico Apple Mac Studio style.
   4 actos × 75% scroll cada uno (con solapamiento de 5%).
   Container: 300vh desktop / 200vh mobile.
   ═════════════════════════════════════════════════════════════════════ */

export default function HatchHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const [mobile, setMobile] = useState(false);
  const [lowEnd, setLowEnd] = useState(false);

  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768);
    check();
    let timeout: ReturnType<typeof setTimeout>;
    const debounced = () => {
      clearTimeout(timeout);
      timeout = setTimeout(check, 150);
    };
    window.addEventListener("resize", debounced, { passive: true });

    /* Low-end device detection */
    const nav = navigator as any;
    const lowMem = (nav.deviceMemory ?? 8) < 4;
    const lowCores = (nav.hardwareConcurrency ?? 8) < 4;
    if (lowMem || lowCores) setLowEnd(true);

    return () => {
      window.removeEventListener("resize", debounced);
      clearTimeout(timeout);
    };
  }, []);

  /* scrollYProgress manual: window scroll relativo al container */
  const scrollYProgress = useMotionValue(0);

  useEffect(() => {
    const update = () => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const scrolled = -rect.top;
      const total = rect.height - window.innerHeight;
      const p = total > 0 ? Math.max(0, Math.min(1, scrolled / total)) : 0;
      scrollYProgress.set(p);
    };
    /* Initial sync + listeners */
    update();
    const handleScroll = () => update();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [scrollYProgress]);

  /* Fallback estático (reduce motion o low-end) */
  if (reduceMotion || lowEnd) {
    return <HatchHeroStatic mobile={mobile} />;
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ height: mobile ? "200vh" : "300vh" }}
      data-component="hatch-hero"
    >
      <div
        className="sticky top-0 h-screen w-full overflow-hidden bg-hatch-athens"
        style={{ transform: "translate3d(0,0,0)" }}
      >
        <BackgroundVideoLayer />
        <HatchNavbar />

        <Acts
          progress={scrollYProgress}
          mobile={mobile}
        />

        {/* Scroll indicator (acto 1 only) */}
        <ScrollHint progress={scrollYProgress} />
      </div>
    </div>
  );
}

/* ─── Acts wrapper ────────────────────────────────────────────────── */

function Acts({ progress, mobile }: { progress: MotionValue<number>; mobile: boolean }) {
  const { act1, act2, act3, act4, act1Inner, act2Inner, act3Inner, act4Inner } = useActProgress(progress);

  return (
    <>
      <Act1 opacity={act1} inner={act1Inner} mobile={mobile} />
      <Act2 opacity={act2} inner={act2Inner} mobile={mobile} />
      <Act3 opacity={act3} inner={act3Inner} mobile={mobile} />
      <Act4 opacity={act4} inner={act4Inner} mobile={mobile} />
    </>
  );
}

/* ─── ACT 1 · Entrada ─────────────────────────────────────────────── */

function Act1({ opacity, inner, mobile }: { opacity: MotionValue<number>; inner: MotionValue<number>; mobile: boolean }) {
  const blur = useTransform(inner, [0, 1], [14, 10]);
  const calOpacity = useTransform(inner, [0, 1], [0.18, 0.10]);
  const calFilter = useTransform(blur, (v) => `blur(${v}px)`);

  /* Headlines visible desde inicio — son lo primero que ve el usuario */
  const badgeY = useTransform(inner, [0, 0.85, 1], [0, 0, -8]);
  const badgeOpacity = useTransform(inner, [0, 0.85, 1], [1, 1, 0.4]);

  const headlineY = useTransform(inner, [0, 0.85, 1], [0, 0, -16]);
  const headlineOpacity = useTransform(inner, [0, 0.85, 1], [1, 1, 0.55]);

  const subY = useTransform(inner, [0, 0.85, 1], [0, 0, -8]);
  const subOpacity = useTransform(inner, [0, 0.85, 1], [1, 1, 0.4]);

  const folderRotate = useTransform(inner, [0, 1], [0, -2]);
  const folderSize = mobile ? 200 : 280;

  return (
    <motion.div
      style={{ opacity }}
      className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6"
      data-act="1"
    >
      {/* Background calendar (blurred, very subtle) */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ opacity: calOpacity, filter: calFilter }}
      >
        <CalendarGrid lit={0} mobile={mobile} showHeader={false} />
      </motion.div>

      {/* USP Badge — el factor diferencial visible AT FIRST GLANCE */}
      <motion.div
        className="relative z-30 mb-6"
        style={{ y: badgeY, opacity: badgeOpacity, willChange: "transform, opacity" }}
      >
        <div
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-semibold tracking-wide backdrop-blur-md"
          style={{
            background: "rgba(29,29,31,0.06)",
            border: "1px solid rgba(29,29,31,0.10)",
            color: "#1D1D1F",
          }}
        >
          <span className="relative flex h-1.5 w-1.5">
            <span
              className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping"
              style={{ background: "#7DBCBE" }}
            />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: "#A8DADC" }} />
          </span>
          El único scheduler que entiende carpetas
        </div>
      </motion.div>

      {/* Headline — JUMBO oversized */}
      <motion.h1
        className="relative z-20 text-center"
        style={{
          y: headlineY,
          opacity: headlineOpacity,
          fontFamily: "Satoshi, Inter, system-ui, sans-serif",
          fontWeight: 800,
          letterSpacing: "-0.045em",
          lineHeight: 0.92,
          color: "#1D1D1F",
          fontSize: mobile ? "clamp(2.6rem, 9vw, 5rem)" : "clamp(4.2rem, 9.5vw, 9.5rem)",
          willChange: "transform, opacity",
        }}
      >
        Drop a <span style={{ color: "#7DBCBE" }}>folder.</span>
      </motion.h1>

      {/* Sub copy — humor + claridad de qué hace el producto */}
      <motion.p
        className="relative z-20 text-center mt-7 mb-12 max-w-xl"
        style={{
          y: subY,
          opacity: subOpacity,
          color: "#48484A",
          fontSize: mobile ? "clamp(0.95rem, 2.6vw, 1.1rem)" : "1.18rem",
          lineHeight: 1.5,
          fontWeight: 400,
          willChange: "transform, opacity",
        }}
      >
        Sí, una carpeta. La que ya tienes en Drive.
        <br className="hidden sm:block" />
        <span style={{ color: "#1D1D1F", fontWeight: 500 }}>
          La sueltas y olvidas que existían los lunes.
        </span>
      </motion.p>

      {/* Folder centered — float + ligero tilt al scroll */}
      <motion.div
        className="relative z-10"
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        style={{ rotate: folderRotate, willChange: "transform" }}
      >
        <FolderAsset state="closed" size={folderSize} />
      </motion.div>
    </motion.div>
  );
}

/* ─── ACT 2 · Apertura ────────────────────────────────────────────── */

function Act2({ opacity, inner, mobile }: { opacity: MotionValue<number>; inner: MotionValue<number>; mobile: boolean }) {
  /* Folder breathing: rota suavemente y crece — premium feel */
  const folderRotateY = useTransform(inner, [0, 0.5, 1], [-6, 2, 6]);
  const folderRotateX = useTransform(inner, [0, 1], [3, -2]);
  const folderScale = useTransform(inner, [0, 1], [0.96, 1.08]);
  const folderY = useTransform(inner, [0, 1], [0, -8]);

  const headlineY = useTransform(inner, [0, 0.25], [28, 0]);
  const headlineOpacity = useTransform(inner, [0, 0.25, 0.85, 1], [0, 1, 1, 0.6]);

  const subY = useTransform(inner, [0, 0.30], [20, 0]);
  const subOpacity = useTransform(inner, [0, 0.30, 0.85, 1], [0, 1, 1, 0.4]);

  const folderSize = mobile ? 230 : 340;

  /* Cross-fade closed→open en el 45-58% del acto (más suave que antes) */
  const closedOpacity = useTransform(inner, [0.40, 0.58], [1, 0]);
  const openOpacity = useTransform(inner, [0.40, 0.58], [0, 1]);

  return (
    <motion.div
      style={{ opacity }}
      className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6"
      data-act="2"
    >
      {/* Headline */}
      <motion.h1
        className="relative z-20 text-center mb-4"
        style={{
          y: headlineY,
          opacity: headlineOpacity,
          fontFamily: "Satoshi, Inter, system-ui, sans-serif",
          fontWeight: 800,
          letterSpacing: "-0.045em",
          lineHeight: 0.92,
          color: "#1D1D1F",
          fontSize: mobile ? "clamp(2.4rem, 8vw, 4.8rem)" : "clamp(3.8rem, 8.5vw, 8rem)",
          willChange: "transform, opacity",
        }}
      >
        La <span style={{ color: "#7DBCBE" }}>abrimos</span> por ti.
      </motion.h1>

      {/* Sub copy */}
      <motion.p
        className="relative z-20 text-center mb-10 max-w-md"
        style={{
          y: subY,
          opacity: subOpacity,
          color: "#48484A",
          fontSize: mobile ? "1rem" : "1.1rem",
          lineHeight: 1.5,
          willChange: "transform, opacity",
        }}
      >
        Detectamos carruseles, leemos los <code style={{ background: "rgba(29,29,31,0.06)", padding: "1px 6px", borderRadius: 4, fontSize: "0.92em", color: "#1D1D1F" }}>caption.txt</code>, ordenamos por fecha. Sin que toques nada.
      </motion.p>

      {/* Folder transitioning */}
      <motion.div
        className="relative z-10"
        style={{
          rotateY: folderRotateY,
          rotateX: folderRotateX,
          scale: folderScale,
          y: folderY,
          transformPerspective: 1400,
          transformStyle: "preserve-3d",
          willChange: "transform",
        }}
      >
        <motion.div className="absolute inset-0" style={{ opacity: closedOpacity }}>
          <FolderAsset state="closed" size={folderSize} />
        </motion.div>
        <motion.div style={{ opacity: openOpacity }}>
          <FolderAsset state="open" size={folderSize} />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

/* ─── ACT 3 · Explosión (30 posts) ────────────────────────────────── */

function Act3({ opacity, inner, mobile }: { opacity: MotionValue<number>; inner: MotionValue<number>; mobile: boolean }) {
  const [lit, setLit] = useState(0);

  /* Update lit count based on inner progress — prev compare evita re-renders */
  useMotionValueEvent(inner, "change", (v) => {
    const newLit = Math.min(30, Math.max(0, Math.floor(v * 32)));
    setLit((prev) => (prev === newLit ? prev : newLit));
  });

  const headlineY = useTransform(inner, [0, 0.3], [40, 0]);
  const headlineOpacity = useTransform(inner, [0, 0.3], [0, 1]);

  /* Pre-compute target positions for 30 tiles based on grid layout */
  const targets = useMemo(() => {
    const cols = mobile ? 5 : 6;
    const rows = mobile ? 6 : 5;
    const cellSize = mobile ? 48 : 70;
    const gap = mobile ? 6 : 8;
    const totalW = cols * cellSize + (cols - 1) * gap;
    const totalH = rows * cellSize + (rows - 1) * gap;
    return Array.from({ length: 30 }).map((_, i) => {
      const r = Math.floor(i / cols);
      const c = i % cols;
      const x = c * (cellSize + gap) - totalW / 2 + cellSize / 2;
      const y = r * (cellSize + gap) - totalH / 2 + cellSize / 2;
      return { x, y };
    });
  }, [mobile]);

  return (
    <motion.div
      style={{ opacity }}
      className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6"
      data-act="3"
    >
      {/* Headline */}
      <motion.h1
        className="relative z-30 text-center mb-3"
        style={{
          y: headlineY,
          opacity: headlineOpacity,
          fontFamily: "Satoshi, Inter, system-ui, sans-serif",
          fontWeight: 800,
          letterSpacing: "-0.045em",
          lineHeight: 0.92,
          color: "#1D1D1F",
          fontSize: mobile ? "clamp(2.4rem, 8vw, 4.8rem)" : "clamp(3.8rem, 8.5vw, 8rem)",
          willChange: "transform, opacity",
        }}
      >
        Un mes en <span style={{ color: "#7DBCBE" }}>30 segundos.</span>
      </motion.h1>

      {/* Sub copy */}
      <p
        className="relative z-20 text-center mb-8"
        style={{ color: "#48484A", fontSize: mobile ? "0.95rem" : "1.05rem", maxWidth: 480 }}
      >
        Cada post en su día, su hora y con su caption. Tú, mientras, estás haciendo otra cosa.
      </p>

      {/* Calendar with progressive lit slots */}
      <div className="relative z-10">
        <CalendarGrid lit={lit} mobile={mobile} />

        {/* Cascade of flying posts (centered origin, fly to grid positions) */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          {targets.map((t, i) => (
            <FlyingPost
              key={i}
              index={i}
              targetX={t.x}
              targetY={t.y}
              progress={inner}
              mobile={mobile}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function FlyingPost({
  index, targetX, targetY, progress, mobile,
}: { index: number; targetX: number; targetY: number; progress: MotionValue<number>; mobile: boolean }) {
  const cellSize = mobile ? 48 : 70;
  const tileSize = cellSize - 16;

  /* Stagger: each post has 0.033s delay, animation lasts 0.4 of inner progress */
  const delay = (index / 30) * 0.5; // distribute over first 50% of act
  const x = useTransform(progress, [delay, delay + 0.4], [0, targetX]);
  const y = useTransform(progress, [delay, delay + 0.4], [-30, targetY]);
  const scale = useTransform(progress, [delay, delay + 0.05, delay + 0.4], [0, 1.2, 1]);
  const opacity = useTransform(progress, [delay, delay + 0.05, delay + 0.35, delay + 0.45], [0, 1, 1, 0]);

  return (
    <motion.div
      style={{
        position: "absolute",
        x, y, scale, opacity,
        willChange: "transform, opacity",
      }}
    >
      <PostTile index={index} size={tileSize} style={{ borderRadius: 6 }} />
    </motion.div>
  );
}

/* ─── ACT 4 · Resultado ───────────────────────────────────────────── */

function Act4({ opacity, inner, mobile }: { opacity: MotionValue<number>; inner: MotionValue<number>; mobile: boolean }) {
  const headlineY = useTransform(inner, [0, 0.25], [28, 0]);
  const headlineOpacity = useTransform(inner, [0, 0.25], [0, 1]);
  const calY = useTransform(inner, [0, 0.4], [40, 0]);
  const calOpacity = useTransform(inner, [0, 0.4], [0, 1]);
  const ctaY = useTransform(inner, [0.35, 0.65], [40, 0]);
  const ctaOpacity = useTransform(inner, [0.35, 0.65], [0, 1]);

  return (
    <motion.div
      style={{ opacity }}
      className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6"
      data-act="4"
    >
      {/* Headline */}
      <motion.h1
        className="relative z-30 text-center mb-3"
        style={{
          y: headlineY,
          opacity: headlineOpacity,
          fontFamily: "Satoshi, Inter, system-ui, sans-serif",
          fontWeight: 800,
          letterSpacing: "-0.045em",
          lineHeight: 0.95,
          color: "#1D1D1F",
          fontSize: mobile ? "clamp(2.1rem, 7vw, 4.2rem)" : "clamp(2.8rem, 6.5vw, 5.6rem)",
          willChange: "transform, opacity",
        }}
      >
        Listo en <span style={{ color: "#7DBCBE" }}>2 minutos.</span>
      </motion.h1>

      {/* Sub copy con humor */}
      <motion.p
        className="relative z-20 text-center mb-8 max-w-md"
        style={{
          opacity: headlineOpacity,
          color: "#48484A",
          fontSize: mobile ? "0.95rem" : "1.05rem",
        }}
      >
        Lo que tu CM hacía un lunes entero. Sin pagar a nadie por el trauma.
      </motion.p>

      {/* Calendar lleno con BorderBeam */}
      <motion.div
        className="relative z-10 mb-7"
        style={{ y: calY, opacity: calOpacity, willChange: "transform, opacity" }}
      >
        <BorderBeam size={mobile ? 220 : 360} duration={5} color="#A8DADC" colorTo="#7DBCBE" borderWidth={1.5}>
          <CalendarGrid lit={30} mobile={mobile} glow />
        </BorderBeam>
      </motion.div>

      {/* Counter — ticker con format exacto */}
      <motion.div
        className="relative z-20 mb-7 flex items-center gap-2.5 text-sm"
        style={{ opacity: ctaOpacity, color: "#48484A" }}
      >
        <span className="font-bold tabular-nums text-base" style={{ color: "#1D1D1F" }}>
          <NumberTicker value={30} trigger="inView" />
        </span>
        <span>posts programados</span>
        <span style={{ color: "#86868B" }}>·</span>
        <span>en</span>
        <span className="font-bold tabular-nums text-base" style={{ color: "#1D1D1F" }}>
          2:14
        </span>
      </motion.div>

      {/* CTA dual */}
      <motion.div
        style={{ y: ctaY, opacity: ctaOpacity }}
        className="relative z-20 flex flex-col sm:flex-row items-center gap-3 mb-5"
      >
        <MotionMagnetic strength={0.14} scale>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 text-sm font-semibold px-8 py-4 rounded-full transition-transform active:scale-[0.97]"
            style={{
              background: "#1D1D1F",
              color: "#F5F5F7",
              boxShadow: "0 16px 40px -12px rgba(29,29,31,0.55), 0 0 0 1px #1D1D1F, 0 0 48px -10px rgba(168,218,220,0.40)",
            }}
          >
            Probar con mi carpeta — gratis
            <ArrowRight className="h-4 w-4" />
          </Link>
        </MotionMagnetic>
        <Link
          href="#como-funciona"
          className="inline-flex items-center gap-2 text-sm font-semibold px-6 py-4 rounded-full border transition-colors hover:bg-white/40"
          style={{ borderColor: "rgba(0,0,0,0.14)", color: "#1D1D1F" }}
        >
          Ver demo de 90s
        </Link>
      </motion.div>

      {/* Trust microcopy bajo el CTA */}
      <motion.div
        style={{ opacity: ctaOpacity }}
        className="relative z-20 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px] font-medium"
      >
        <span className="inline-flex items-center gap-1.5" style={{ color: "#86868B" }}>
          <span className="h-1 w-1 rounded-full" style={{ background: "#16A34A" }} />
          Sin tarjeta
        </span>
        <span className="inline-flex items-center gap-1.5" style={{ color: "#86868B" }}>
          <span className="h-1 w-1 rounded-full" style={{ background: "#7DBCBE" }} />
          API oficial de Meta
        </span>
        <span className="inline-flex items-center gap-1.5" style={{ color: "#86868B" }}>
          <span className="h-1 w-1 rounded-full" style={{ background: "#86868B" }} />
          Cifrado AES-256
        </span>
      </motion.div>
    </motion.div>
  );
}

/* ─── Background video as subtle layer ────────────────────────────── */

function BackgroundVideoLayer() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          opacity: 0.08,
          filter: "grayscale(100%) blur(2px)",
          mixBlendMode: "luminosity",
        }}
      >
        <source
          src="https://res.cloudinary.com/dfonotyfb/video/upload/v1775585556/dds3_1_rqhg7x.mp4"
          type="video/mp4"
        />
      </video>
      {/* White wash on top */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(245,245,247,0.85) 100%)",
        }}
      />
      {/* Cobalt soft tint */}
      <div
        className="absolute inset-0 mix-blend-soft-light opacity-30"
        style={{
          background: "radial-gradient(ellipse 70% 50% at 50% 60%, #A8DADC 0%, transparent 60%)",
        }}
      />
    </div>
  );
}

/* ─── Hatch frosted nav ───────────────────────────────────────────── */

function HatchNavbar() {
  return (
    <nav
      className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 sm:px-8 py-4"
      style={{
        background: "rgba(245,245,247,0.72)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
      }}
    >
      <div className="flex items-center gap-2.5">
        <div
          className="h-7 w-7 rounded-md flex items-center justify-center"
          style={{ background: "#1D1D1F" }}
        >
          <Egg className="h-3.5 w-3.5" style={{ color: "#A8DADC" }} />
        </div>
        <span
          className="font-bold text-base"
          style={{
            color: "#1D1D1F",
            letterSpacing: "-0.01em",
            fontFamily: "Satoshi, Inter, system-ui, sans-serif",
          }}
        >
          Hatch
        </span>
      </div>
      <div className="flex items-center gap-5 text-sm">
        <a href="#como-funciona" className="hidden sm:inline" style={{ color: "#48484A" }}>Producto</a>
        <a href="#precios" className="hidden sm:inline" style={{ color: "#48484A" }}>Precios</a>
        <Link
          href="/login"
          className="hidden sm:inline text-sm font-medium"
          style={{ color: "#48484A" }}
        >
          Iniciar sesión
        </Link>
        <Link
          href="/signup"
          className="text-sm font-semibold px-4 py-2 rounded-full"
          style={{ background: "#1D1D1F", color: "#F5F5F7" }}
        >
          Empezar
        </Link>
      </div>
    </nav>
  );
}

/* ─── Scroll hint (acto 1 only) ───────────────────────────────────── */

function ScrollHint({ progress }: { progress: MotionValue<number> }) {
  const opacity = useTransform(progress, [0, 0.02, 0.15], [1, 1, 0]);
  return (
    <motion.div
      style={{ opacity }}
      className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 text-xs"
    >
      <span className="font-semibold uppercase tracking-widest" style={{ color: "#86868B" }}>
        Scroll
      </span>
      <motion.div
        className="h-8 w-[1.5px] rounded-full"
        style={{ background: "linear-gradient(180deg, #86868B, transparent)" }}
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.div>
  );
}

/* ─── Static fallback (reduce motion / low-end) ───────────────────── */

function HatchHeroStatic({ mobile }: { mobile: boolean }) {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-hatch-athens" data-fallback="static">
      <BackgroundVideoLayer />
      <HatchNavbar />
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-6">
        <h1
          className="text-center mb-8"
          style={{
            fontFamily: "Satoshi, Inter, system-ui, sans-serif",
            fontWeight: 800,
            letterSpacing: "-0.045em",
            lineHeight: 0.92,
            color: "#1D1D1F",
            fontSize: mobile ? "clamp(2.25rem, 7vw, 4.5rem)" : "clamp(3rem, 7vw, 6rem)",
          }}
        >
          Drop a folder.<br />
          <span style={{ color: "#7DBCBE" }}>Hatch a month.</span>
        </h1>
        <div className="mb-8">
          <CalendarGrid lit={30} mobile={mobile} glow />
        </div>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 text-sm font-semibold px-7 py-3.5 rounded-full"
          style={{ background: "#1D1D1F", color: "#F5F5F7" }}
        >
          Empezar gratis
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
