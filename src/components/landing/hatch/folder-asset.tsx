"use client";

import { motion } from "framer-motion";

/* ────────────────────────────────────────────────────────────────────
   Folder asset v2 — material premium real con depth, edges suaves,
   metal/plástico look. Inspirado en macOS Finder + iOS folders.
   Variants: closed | open. SVG inline, sin assets externos.
   ──────────────────────────────────────────────────────────────────── */

type Props = {
  state?: "closed" | "open";
  size?: number;
  className?: string;
};

export function FolderAsset({ state = "closed", size = 280, className = "" }: Props) {
  const w = size;
  const h = size * 0.82;

  return (
    <svg
      viewBox="0 0 440 360"
      width={w}
      height={h}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        filter: `
          drop-shadow(0 32px 48px rgba(15,15,20,0.32))
          drop-shadow(0 12px 18px rgba(15,15,20,0.18))
          drop-shadow(0 2px 4px rgba(15,15,20,0.10))
        `,
      }}
    >
      <defs>
        {/* ── Body: graphite con micro-texture material ── */}
        <linearGradient id="bodyMain" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#3A3A3D" />
          <stop offset="20%" stopColor="#2C2C2E" />
          <stop offset="60%" stopColor="#1F1F22" />
          <stop offset="100%" stopColor="#16161A" />
        </linearGradient>

        {/* ── Top edge subtle highlight ── */}
        <linearGradient id="topRim" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
          <stop offset="40%" stopColor="rgba(255,255,255,0.04)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>

        {/* ── Bottom inner shadow ── */}
        <linearGradient id="innerDepth" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(0,0,0,0)" />
          <stop offset="80%" stopColor="rgba(0,0,0,0.22)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.42)" />
        </linearGradient>

        {/* ── Tab gradient slightly lighter than body ── */}
        <linearGradient id="tabGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#48484A" />
          <stop offset="50%" stopColor="#36363A" />
          <stop offset="100%" stopColor="#26262A" />
        </linearGradient>

        {/* ── Cobalt edge glow at the bottom (signature) ── */}
        <linearGradient id="cobaltGlow" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(168,218,220,0)" />
          <stop offset="35%" stopColor="rgba(168,218,220,0.55)" />
          <stop offset="65%" stopColor="rgba(125,188,190,0.55)" />
          <stop offset="100%" stopColor="rgba(168,218,220,0)" />
        </linearGradient>

        {/* ── Front-face subtle vignette ── */}
        <radialGradient id="vignette" cx="50%" cy="55%" r="70%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.04)" />
          <stop offset="60%" stopColor="rgba(0,0,0,0)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.18)" />
        </radialGradient>

        {/* ── Paper interior gradient ── */}
        <linearGradient id="paperFront" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="60%" stopColor="#FAFAFC" />
          <stop offset="100%" stopColor="#EAEAEF" />
        </linearGradient>

        {/* ── Back paper (slightly cooler) ── */}
        <linearGradient id="paperBack" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F0F0F4" />
          <stop offset="100%" stopColor="#D8D8E0" />
        </linearGradient>

        {/* ── Specular highlight on top-left of body ── */}
        <radialGradient id="specular" cx="22%" cy="18%" r="40%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.16)" />
          <stop offset="60%" stopColor="rgba(255,255,255,0.04)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>

        {/* ── Mini thumbnails inside open folder ── */}
        <linearGradient id="thumb1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFB6A3" />
          <stop offset="100%" stopColor="#FF6B9D" />
        </linearGradient>
        <linearGradient id="thumb2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A8DADC" />
          <stop offset="100%" stopColor="#7DBCBE" />
        </linearGradient>
        <linearGradient id="thumb3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>

      {/* ── Tab (back) ── */}
      <path
        d="M 28 70 Q 28 56 42 56 L 168 56 Q 184 56 192 70 L 206 92 L 28 92 Z"
        fill="url(#tabGrad)"
        stroke="rgba(134,134,139,0.30)"
        strokeWidth="0.75"
      />
      {/* tab top highlight */}
      <path
        d="M 28 70 Q 28 56 42 56 L 168 56 Q 184 56 192 70 L 28 70 Z"
        fill="rgba(255,255,255,0.06)"
      />

      {/* ── Interior papers (only in open state) ── */}
      {state === "open" && (
        <g>
          {/* paper back deepest */}
          <motion.g
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.55, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          >
            <rect x="68" y="78" width="304" height="76" rx="8" fill="url(#paperBack)" />
            <rect x="68" y="78" width="304" height="3" fill="rgba(0,0,0,0.06)" />
          </motion.g>

          {/* paper middle */}
          <motion.g
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.55, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
          >
            <rect x="48" y="62" width="344" height="84" rx="9" fill="url(#paperFront)"
              stroke="rgba(0,0,0,0.06)" strokeWidth="0.5" />
            {/* mini thumbnails on this paper to suggest content */}
            <rect x="62" y="78" width="40" height="40" rx="6" fill="url(#thumb1)" />
            <rect x="110" y="78" width="40" height="40" rx="6" fill="url(#thumb2)" />
            <rect x="158" y="78" width="40" height="40" rx="6" fill="url(#thumb3)" />
            {/* text lines mock */}
            <rect x="220" y="84" width="150" height="5" rx="2.5" fill="rgba(0,0,0,0.10)" />
            <rect x="220" y="96" width="120" height="4" rx="2" fill="rgba(0,0,0,0.07)" />
            <rect x="220" y="106" width="140" height="4" rx="2" fill="rgba(0,0,0,0.07)" />
            <rect x="62" y="126" width="308" height="3" rx="1.5" fill="rgba(0,0,0,0.05)" />
          </motion.g>

          {/* paper top (most visible) */}
          <motion.g
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.55, delay: 0.20, ease: [0.16, 1, 0.3, 1] }}
          >
            <rect x="32" y="44" width="376" height="92" rx="10" fill="url(#paperFront)"
              stroke="rgba(0,0,0,0.08)" strokeWidth="0.5" />
            {/* shadow under top paper */}
            <rect x="32" y="44" width="376" height="4" fill="rgba(0,0,0,0.04)" />
            {/* meta.json icon mock */}
            <rect x="48" y="62" width="58" height="58" rx="8" fill="#1D1D1F" />
            <text x="77" y="98" fontSize="11" fill="#A8DADC" textAnchor="middle"
              fontFamily="ui-monospace, SFMono-Regular, monospace" fontWeight="700">
              .ZIP
            </text>
            {/* file rows */}
            <g fontFamily="ui-monospace, SFMono-Regular, monospace" fontSize="9" fill="#48484A">
              <text x="118" y="72">2026-04-15_post-mojito.jpg</text>
              <text x="118" y="86">2026-04-16_carrousel-01.jpg</text>
              <text x="118" y="100">2026-04-16_carrousel-02.jpg</text>
              <text x="118" y="114">caption.txt</text>
            </g>
            {/* cobalt accent dot */}
            <circle cx="395" cy="55" r="3" fill="#A8DADC" opacity="0.85" />
          </motion.g>
        </g>
      )}

      {/* ── Front body (the big rectangle) ── */}
      <path
        d="M 14 92 L 426 92 Q 436 92 436 102 L 436 332 Q 436 344 424 344 L 26 344 Q 14 344 14 332 Z"
        fill="url(#bodyMain)"
      />

      {/* Specular highlight (top-left lobe) */}
      <path
        d="M 14 92 L 426 92 Q 436 92 436 102 L 436 332 Q 436 344 424 344 L 26 344 Q 14 344 14 332 Z"
        fill="url(#specular)"
      />

      {/* Top rim highlight */}
      <path
        d="M 14 92 L 426 92 Q 436 92 436 102 L 436 110 L 14 110 Z"
        fill="url(#topRim)"
      />

      {/* Inner front vignette for depth */}
      <path
        d="M 14 92 L 426 92 Q 436 92 436 102 L 436 332 Q 436 344 424 344 L 26 344 Q 14 344 14 332 Z"
        fill="url(#vignette)"
      />

      {/* Bottom inner shadow */}
      <path
        d="M 14 92 L 426 92 Q 436 92 436 102 L 436 332 Q 436 344 424 344 L 26 344 Q 14 344 14 332 Z"
        fill="url(#innerDepth)"
      />

      {/* Outer 1px stroke to define silhouette */}
      <path
        d="M 14 92 L 426 92 Q 436 92 436 102 L 436 332 Q 436 344 424 344 L 26 344 Q 14 344 14 332 Z"
        fill="none"
        stroke="rgba(0,0,0,0.45)"
        strokeWidth="0.5"
      />

      {/* Subtle inner stroke for premium feel */}
      <path
        d="M 16 94 L 424 94 Q 433 94 433 103 L 433 330 Q 433 341 423 341 L 27 341 Q 17 341 17 330 Z"
        fill="none"
        stroke="rgba(255,255,255,0.05)"
        strokeWidth="0.5"
      />

      {/* ── Cobalt signature edge glow (bottom) ── */}
      <rect x="14" y="340" width="422" height="3" fill="url(#cobaltGlow)" rx="1.5" />

      {/* ── Hatch wordmark on front (only when closed) ── */}
      {state === "closed" && (
        <g opacity="0.9">
          {/* Egg icon */}
          <ellipse cx="220" cy="208" rx="11" ry="14" fill="rgba(168,218,220,0.18)" />
          <ellipse cx="220" cy="208" rx="9" ry="12" fill="none"
            stroke="rgba(168,218,220,0.45)" strokeWidth="1" />
          {/* Hatch label below */}
          <text x="220" y="246" fontSize="13" fontWeight="700" fill="rgba(255,255,255,0.55)"
            textAnchor="middle" fontFamily="Satoshi, Inter, system-ui, sans-serif"
            letterSpacing="0.12em">
            ABRIL · 30 POSTS
          </text>
        </g>
      )}
    </svg>
  );
}
