"use client";

import { motion } from "framer-motion";

/* ────────────────────────────────────────────────────────────────────
   Folder asset — graphite premium con pestaña, profundidad y sombras.
   Variants: closed (default) y open (interior visible con 3 papeles).
   Aluminum Studio palette. Hecho en SVG inline, escalable, sin assets externos.
   ──────────────────────────────────────────────────────────────────── */

type Props = {
  state?: "closed" | "open";
  size?: number;
  className?: string;
};

export function FolderAsset({ state = "closed", size = 280, className = "" }: Props) {
  const w = size;
  const h = size * 0.78;

  return (
    <svg
      viewBox="0 0 400 312"
      width={w}
      height={h}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ filter: "drop-shadow(0 24px 64px rgba(0,0,0,0.28)) drop-shadow(0 8px 16px rgba(0,0,0,0.10))" }}
    >
      <defs>
        {/* Body gradient — graphite premium */}
        <linearGradient id="folderBody" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2C2C2E" />
          <stop offset="50%" stopColor="#1D1D1F" />
          <stop offset="100%" stopColor="#161618" />
        </linearGradient>
        {/* Tab gradient — slightly lighter to suggest depth */}
        <linearGradient id="folderTab" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3A3A3D" />
          <stop offset="100%" stopColor="#262628" />
        </linearGradient>
        {/* Inner shadow for depth */}
        <linearGradient id="innerShadow" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(0,0,0,0.4)" />
          <stop offset="40%" stopColor="rgba(0,0,0,0)" />
        </linearGradient>
        {/* Highlight on top edge */}
        <linearGradient id="topHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        {/* Cobalt edge glow */}
        <linearGradient id="cobaltEdge" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(168,218,220,0)" />
          <stop offset="50%" stopColor="rgba(168,218,220,0.4)" />
          <stop offset="100%" stopColor="rgba(168,218,220,0)" />
        </linearGradient>
        {/* Paper gradient for interior posts */}
        <linearGradient id="paper1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FAFAFC" />
          <stop offset="100%" stopColor="#E8E8ED" />
        </linearGradient>
      </defs>

      {/* Tab (back tab of folder) */}
      <path
        d="M 24 60 Q 24 48 36 48 L 156 48 Q 168 48 174 60 L 184 78 L 24 78 Z"
        fill="url(#folderTab)"
        stroke="rgba(134,134,139,0.25)"
        strokeWidth="0.5"
      />

      {/* Interior papers (only visible in 'open' state) */}
      {state === "open" && (
        <g>
          <motion.rect
            x="80" y="100" width="240" height="60"
            rx="6"
            fill="url(#paper1)"
            stroke="rgba(0,0,0,0.06)"
            strokeWidth="0.5"
            initial={{ y: 130, opacity: 0 }}
            animate={{ y: 100, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
            style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.08))" }}
          />
          <motion.rect
            x="60" y="78" width="280" height="62"
            rx="6"
            fill="url(#paper1)"
            stroke="rgba(0,0,0,0.08)"
            strokeWidth="0.5"
            initial={{ y: 110, opacity: 0 }}
            animate={{ y: 78, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.10, ease: [0.16, 1, 0.3, 1] }}
            style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.10))" }}
          />
          <motion.rect
            x="40" y="58" width="320" height="64"
            rx="6"
            fill="url(#paper1)"
            stroke="rgba(0,0,0,0.10)"
            strokeWidth="0.5"
            initial={{ y: 95, opacity: 0 }}
            animate={{ y: 58, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            style={{ filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.12))" }}
          />
        </g>
      )}

      {/* Front body of folder */}
      <path
        d="M 12 78 L 388 78 Q 396 78 396 86 L 396 286 Q 396 296 386 296 L 22 296 Q 12 296 12 286 Z"
        fill="url(#folderBody)"
        stroke="rgba(134,134,139,0.30)"
        strokeWidth="0.75"
      />

      {/* Top edge highlight */}
      <path
        d="M 12 78 L 388 78 Q 396 78 396 86 L 396 96 L 12 96 Z"
        fill="url(#topHighlight)"
      />

      {/* Inner shadow on top */}
      <path
        d="M 12 78 L 388 78 Q 396 78 396 86 L 396 110 L 12 110 Z"
        fill="url(#innerShadow)"
        opacity="0.6"
      />

      {/* Cobalt edge accent on bottom */}
      <rect x="12" y="294" width="384" height="2" fill="url(#cobaltEdge)" rx="1" />

      {/* Tab corner highlight */}
      <path
        d="M 24 60 Q 24 48 36 48 L 156 48 Q 168 48 174 60 L 24 60 Z"
        fill="rgba(255,255,255,0.04)"
      />

      {/* Subtle silver accent on label area */}
      {state === "closed" && (
        <g opacity="0.85">
          <rect x="160" y="180" width="80" height="6" rx="3" fill="rgba(134,134,139,0.18)" />
          <rect x="170" y="194" width="60" height="4" rx="2" fill="rgba(134,134,139,0.10)" />
        </g>
      )}
    </svg>
  );
}
