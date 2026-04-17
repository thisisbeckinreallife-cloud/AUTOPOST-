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
  const blur = useTransform(inner, [0, 1], [12, 8]);
  const calOpacity = useTransform(inner, [0, 1], [0.25, 0.15]);
  const calFilter = useTransform(blur, (v) => `blur(${v}px)`);

  /* Headline visible desde p=0 (es lo primero que ve el usuario) */
  const headlineY = useTransform(inner, [0, 0.8, 1], [0, 0, -20]);
  const headlineOpacity = useTransform(inner, [0, 0.8, 1], [1, 1, 0.6]);

  const folderSize = mobile ? 180 : 260;

  return (
    <motion.div
      style={{ opacity }}
      className="absolute inset-0 z-10 flex flex-col items-center justify-center"
      data-act="1"
    >
      {/* Background calendar (blurred) */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ opacity: calOpacity, filter: calFilter }}
      >
        <CalendarGrid lit={0} mobile={mobile} showHeader={false} />
      </motion.div>

      {/* Headline */}
      <motion.h1
        className="relative z-20 text-center px-6 mb-12"
        style={{
          y: headlineY,
          opacity: headlineOpacity,
          fontFamily: "Satoshi, Inter, system-ui, sans-serif",
          fontWeight: 800,
          letterSpacing: "-0.045em",
          lineHeight: 0.92,
          color: "#1D1D1F",
          fontSize: mobile ? "clamp(2.5rem, 8vw, 5rem)" : "clamp(4rem, 9vw, 9rem)",
          willChange: "transform, opacity",
        }}
      >
        Drop a <span style={{ color: "#7DBCBE" }}>folder.</span>
      </motion.h1>

      {/* Folder centered with floating animation */}
      <motion.div
        className="relative z-10"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{ willChange: "transform" }}
      >
        <FolderAsset state="closed" size={folderSize} />
      </motion.div>
    </motion.div>
  );
}

/* ─── ACT 2 · Apertura ────────────────────────────────────────────── */

function Act2({ opacity, inner, mobile }: { opacity: MotionValue<number>; inner: MotionValue<number>; mobile: boolean }) {
  const folderRotateY = useTransform(inner, [0, 0.6, 1], [-10, 0, 5]);
  const folderScale = useTransform(inner, [0, 1], [1, 1.1]);

  const headlineY = useTransform(inner, [0, 0.3], [40, 0]);
  const headlineOpacity = useTransform(inner, [0, 0.3], [0, 1]);

  const folderSize = mobile ? 200 : 300;

  /* Cross-fade entre closed y open en el 50% del acto */
  const closedOpacity = useTransform(inner, [0.4, 0.55], [1, 0]);
  const openOpacity = useTransform(inner, [0.4, 0.55], [0, 1]);

  return (
    <motion.div
      style={{ opacity }}
      className="absolute inset-0 z-10 flex flex-col items-center justify-center"
      data-act="2"
    >
      {/* Headline */}
      <motion.h1
        className="relative z-20 text-center px-6 mb-12"
        style={{
          y: headlineY,
          opacity: headlineOpacity,
          fontFamily: "Satoshi, Inter, system-ui, sans-serif",
          fontWeight: 800,
          letterSpacing: "-0.045em",
          lineHeight: 0.92,
          color: "#1D1D1F",
          fontSize: mobile ? "clamp(2.5rem, 8vw, 5rem)" : "clamp(4rem, 9vw, 9rem)",
          willChange: "transform, opacity",
        }}
      >
        Watch it <span style={{ color: "#7DBCBE" }}>open.</span>
      </motion.h1>

      {/* Folder transitioning */}
      <motion.div
        className="relative z-10"
        style={{
          rotateY: folderRotateY,
          scale: folderScale,
          transformPerspective: 1200,
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

  /* Update lit count based on inner progress */
  useMotionValueEvent(inner, "change", (v) => {
    const newLit = Math.min(30, Math.floor(v * 32));
    setLit(newLit);
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
      className="absolute inset-0 z-10 flex flex-col items-center justify-center"
      data-act="3"
    >
      {/* Headline */}
      <motion.h1
        className="relative z-30 text-center px-6 mb-8"
        style={{
          y: headlineY,
          opacity: headlineOpacity,
          fontFamily: "Satoshi, Inter, system-ui, sans-serif",
          fontWeight: 800,
          letterSpacing: "-0.045em",
          lineHeight: 0.92,
          color: "#1D1D1F",
          fontSize: mobile ? "clamp(2.5rem, 8vw, 5rem)" : "clamp(4rem, 9vw, 9rem)",
          willChange: "transform, opacity",
        }}
      >
        <span style={{ color: "#7DBCBE" }}>Hatch</span> a month.
      </motion.h1>

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
  const headlineY = useTransform(inner, [0, 0.3], [40, 0]);
  const headlineOpacity = useTransform(inner, [0, 0.3], [0, 1]);
  const ctaY = useTransform(inner, [0.3, 0.6], [40, 0]);
  const ctaOpacity = useTransform(inner, [0.3, 0.6], [0, 1]);

  return (
    <motion.div
      style={{ opacity }}
      className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6"
      data-act="4"
    >
      {/* Headline */}
      <motion.h1
        className="relative z-30 text-center mb-8"
        style={{
          y: headlineY,
          opacity: headlineOpacity,
          fontFamily: "Satoshi, Inter, system-ui, sans-serif",
          fontWeight: 800,
          letterSpacing: "-0.045em",
          lineHeight: 0.92,
          color: "#1D1D1F",
          fontSize: mobile ? "clamp(2.25rem, 7vw, 4.5rem)" : "clamp(3rem, 7vw, 6rem)",
          willChange: "transform, opacity",
        }}
      >
        Done in <span style={{ color: "#7DBCBE" }}>2 minutes.</span>
      </motion.h1>

      {/* Calendar lleno con BorderBeam */}
      <div className="relative z-10 mb-10">
        <BorderBeam size={mobile ? 200 : 320} duration={6} color="#A8DADC" colorTo="#7DBCBE" borderWidth={1.5}>
          <CalendarGrid lit={30} mobile={mobile} glow />
        </BorderBeam>
      </div>

      {/* Counter */}
      <motion.div
        className="relative z-20 mb-8 flex items-center gap-3 text-sm font-medium"
        style={{
          opacity: ctaOpacity,
          color: "#48484A",
          fontFamily: "Satoshi, Inter, system-ui, sans-serif",
        }}
      >
        <span className="font-bold tabular-nums" style={{ color: "#1D1D1F" }}>
          <NumberTicker value={30} trigger="inView" />
        </span>
        <span>posts programados</span>
        <span style={{ color: "#86868B" }}>·</span>
        <span>2 min</span>
        <span className="font-bold tabular-nums" style={{ color: "#1D1D1F" }}>
          <NumberTicker value={14} trigger="inView" delay={0.3} />
        </span>
        <span>s</span>
      </motion.div>

      {/* CTA */}
      <motion.div
        style={{ y: ctaY, opacity: ctaOpacity }}
        className="relative z-20 flex flex-col sm:flex-row items-center gap-3"
      >
        <MotionMagnetic strength={0.12} scale>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 text-sm font-semibold px-7 py-3.5 rounded-full transition-transform active:scale-[0.97]"
            style={{
              background: "#1D1D1F",
              color: "#F5F5F7",
              boxShadow: "0 12px 32px -12px rgba(29,29,31,0.6), 0 0 0 1px #1D1D1F, 0 0 32px -8px rgba(168,218,220,0.3)",
            }}
          >
            Empezar gratis
            <ArrowRight className="h-4 w-4" />
          </Link>
        </MotionMagnetic>
        <Link
          href="#como-funciona"
          className="inline-flex items-center gap-2 text-sm font-semibold px-6 py-3.5 rounded-full border transition-colors hover:bg-white/40"
          style={{
            borderColor: "rgba(0,0,0,0.12)",
            color: "#1D1D1F",
          }}
        >
          Ver demo de 90s
        </Link>
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
