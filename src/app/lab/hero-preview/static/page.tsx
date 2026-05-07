"use client";

/* ───────────────────────────────────────────────────────────────────
   /hero-preview/static — los 4 actos apilados verticalmente.
   Para validación visual sin depender del pinned scroll.
   Cada bloque renderiza el contenido del acto en su estado pleno.
   ─────────────────────────────────────────────────────────────────── */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Egg } from "lucide-react";
import Link from "next/link";
import { FolderAsset } from "@/components/landing/hatch/folder-asset";
import { PostTile } from "@/components/landing/hatch/post-tile";
import { CalendarGrid } from "@/components/landing/hatch/calendar-grid";
import { MotionMagnetic, BorderBeam, NumberTicker } from "@/components/motion";

const HATCH = {
  graphite: "#1D1D1F",
  athens: "#F5F5F7",
  silver: "#86868B",
  silverDark: "#48484A",
  glow: "#A8DADC",
  cobalt: "#7DBCBE",
  textOnDark: "#F5F5F7",
};

export default function HeroPreviewStatic() {
  return (
    <main style={{ background: "#0A0A0F" }}>
      <Header />
      <Block label="ACT 1 — ENTRADA" desc="Carpeta cerrada, headline grande, scroll hint">
        <Act1Static />
      </Block>
      <Block label="ACT 2 — APERTURA" desc="Carpeta abierta con papeles emergiendo, escala +10%">
        <Act2Static />
      </Block>
      <Block label="ACT 3 — EXPLOSIÓN" desc="Calendar lleno con 30 posts (estado durante cascade)">
        <Act3Static />
      </Block>
      <Block label="ACT 4 — RESULTADO" desc="Calendar pleno con BorderBeam + counter + CTA">
        <Act4Static />
      </Block>
      <Footer />
    </main>
  );
}

function Header() {
  return (
    <div className="border-b border-white/10 px-6 py-5 sticky top-0 z-50" style={{ background: "rgba(10,10,15,0.85)", backdropFilter: "blur(20px)" }}>
      <div className="max-w-6xl mx-auto flex items-center justify-between text-white">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">/hero-preview/static</div>
          <h1 className="text-lg font-bold">Validación visual de los 4 actos</h1>
        </div>
        <Link href="/lab/hero-preview" className="text-xs text-zinc-400 hover:text-white">
          Ver con scroll real →
        </Link>
      </div>
    </div>
  );
}

function Block({ label, desc, children }: { label: string; desc: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-white/10">
      <div className="px-6 py-4 max-w-6xl mx-auto">
        <div className="text-[10px] font-mono font-bold tracking-widest text-zinc-500">{label}</div>
        <div className="text-xs text-zinc-400 mt-0.5">{desc}</div>
      </div>
      <div style={{ minHeight: "100vh", background: HATCH.athens }}>
        {children}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <div className="px-6 py-10 text-center text-xs text-zinc-500">
      Cada bloque muestra el contenido en su estado pleno. En el hero real, los actos transicionan suavemente con scroll.
    </div>
  );
}

function NavbarMini() {
  return (
    <nav
      className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4"
      style={{
        background: "rgba(245,245,247,0.72)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
      }}
    >
      <div className="flex items-center gap-2.5">
        <div className="h-7 w-7 rounded-md flex items-center justify-center" style={{ background: HATCH.graphite }}>
          <Egg className="h-3.5 w-3.5" style={{ color: HATCH.glow }} />
        </div>
        <span className="font-bold text-base" style={{ color: HATCH.graphite, letterSpacing: "-0.01em" }}>Hatch</span>
      </div>
      <div className="flex items-center gap-5 text-sm">
        <span style={{ color: HATCH.silverDark }}>Producto</span>
        <span style={{ color: HATCH.silverDark }}>Precios</span>
        <button className="text-sm font-semibold px-4 py-2 rounded-full" style={{ background: HATCH.graphite, color: HATCH.textOnDark }}>
          Empezar
        </button>
      </div>
    </nav>
  );
}

/* ─── Act 1 ─── */
function Act1Static() {
  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col items-center justify-center px-6">
      <NavbarMini />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ opacity: 0.22, filter: "blur(10px)" }}>
        <CalendarGrid lit={0} showHeader={false} />
      </div>
      <h1
        className="relative z-20 text-center mb-12"
        style={{
          fontFamily: "Satoshi, Inter, system-ui, sans-serif",
          fontWeight: 800,
          letterSpacing: "-0.045em",
          lineHeight: 0.92,
          color: HATCH.graphite,
          fontSize: "clamp(4rem, 9vw, 9rem)",
        }}
      >
        Drop a <span style={{ color: HATCH.cobalt }}>folder.</span>
      </h1>
      <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
        <FolderAsset state="closed" size={260} />
      </motion.div>
      <div className="absolute bottom-10 flex flex-col items-center gap-2 text-xs">
        <span className="font-semibold uppercase tracking-widest" style={{ color: HATCH.silver }}>Scroll</span>
        <motion.div className="h-8 w-[1.5px] rounded-full" style={{ background: `linear-gradient(180deg, ${HATCH.silver}, transparent)` }} animate={{ y: [0, 8, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }} />
      </div>
    </div>
  );
}

/* ─── Act 2 ─── */
function Act2Static() {
  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col items-center justify-center px-6">
      <NavbarMini />
      <h1
        className="relative z-20 text-center mb-12"
        style={{
          fontFamily: "Satoshi, Inter, system-ui, sans-serif",
          fontWeight: 800,
          letterSpacing: "-0.045em",
          lineHeight: 0.92,
          color: HATCH.graphite,
          fontSize: "clamp(4rem, 9vw, 9rem)",
        }}
      >
        Watch it <span style={{ color: HATCH.cobalt }}>open.</span>
      </h1>
      <div style={{ transform: "perspective(1200px) scale(1.1) rotateY(5deg)" }}>
        <FolderAsset state="open" size={300} />
      </div>
    </div>
  );
}

/* ─── Act 3 ─── */
function Act3Static() {
  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col items-center justify-center px-6">
      <NavbarMini />
      <h1
        className="relative z-20 text-center mb-8"
        style={{
          fontFamily: "Satoshi, Inter, system-ui, sans-serif",
          fontWeight: 800,
          letterSpacing: "-0.045em",
          lineHeight: 0.92,
          color: HATCH.graphite,
          fontSize: "clamp(4rem, 9vw, 9rem)",
        }}
      >
        <span style={{ color: HATCH.cobalt }}>Hatch</span> a month.
      </h1>
      <div className="relative">
        {/* Calendar parcial (15 lit) */}
        <CalendarGrid lit={15} />
        {/* Posts volantes alrededor (simulando cascade activa) */}
        <div className="absolute -top-20 -left-20 w-12 h-12 pointer-events-none">
          <PostTile index={20} size={48} />
        </div>
        <div className="absolute -top-16 right-0 w-12 h-12 pointer-events-none">
          <PostTile index={21} size={42} />
        </div>
        <div className="absolute top-1/2 -right-24 w-12 h-12 pointer-events-none">
          <PostTile index={22} size={50} />
        </div>
        <div className="absolute bottom-0 -left-24 w-12 h-12 pointer-events-none">
          <PostTile index={23} size={44} />
        </div>
      </div>
    </div>
  );
}

/* ─── Act 4 ─── */
function Act4Static() {
  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col items-center justify-center px-6">
      <NavbarMini />
      <h1
        className="relative z-30 text-center mb-8"
        style={{
          fontFamily: "Satoshi, Inter, system-ui, sans-serif",
          fontWeight: 800,
          letterSpacing: "-0.045em",
          lineHeight: 0.92,
          color: HATCH.graphite,
          fontSize: "clamp(3rem, 7vw, 6rem)",
        }}
      >
        Done in <span style={{ color: HATCH.cobalt }}>2 minutes.</span>
      </h1>
      <div className="relative z-10 mb-10">
        <BorderBeam size={320} duration={6} color={HATCH.glow} colorTo={HATCH.cobalt} borderWidth={1.5}>
          <CalendarGrid lit={30} glow />
        </BorderBeam>
      </div>
      <div className="relative z-20 mb-8 flex items-center gap-3 text-sm font-medium" style={{ color: HATCH.silverDark, fontFamily: "Satoshi, Inter, system-ui, sans-serif" }}>
        <span className="font-bold tabular-nums" style={{ color: HATCH.graphite }}>
          <NumberTicker value={30} trigger="inView" />
        </span>
        <span>posts programados</span>
        <span style={{ color: HATCH.silver }}>·</span>
        <span>2 min</span>
        <span className="font-bold tabular-nums" style={{ color: HATCH.graphite }}>
          <NumberTicker value={14} trigger="inView" delay={0.3} />
        </span>
        <span>s</span>
      </div>
      <div className="relative z-20 flex flex-col sm:flex-row items-center gap-3">
        <MotionMagnetic strength={0.12} scale>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 text-sm font-semibold px-7 py-3.5 rounded-full"
            style={{
              background: HATCH.graphite,
              color: HATCH.textOnDark,
              boxShadow: `0 12px 32px -12px rgba(29,29,31,0.6), 0 0 0 1px ${HATCH.graphite}, 0 0 32px -8px ${HATCH.glow}50`,
            }}
          >
            Empezar gratis
            <ArrowRight className="h-4 w-4" />
          </Link>
        </MotionMagnetic>
        <Link
          href="#"
          className="inline-flex items-center gap-2 text-sm font-semibold px-6 py-3.5 rounded-full border hover:bg-white/40 transition-colors"
          style={{ borderColor: "rgba(0,0,0,0.12)", color: HATCH.graphite }}
        >
          Ver demo de 90s
        </Link>
      </div>
    </div>
  );
}
