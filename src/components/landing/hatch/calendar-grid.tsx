"use client";

import { motion } from "framer-motion";

/* ────────────────────────────────────────────────────────────────────
   CalendarGrid — grid 6×5 (5×6 mobile) con cells iluminados según `lit`.
   Slots iluminados muestran un mini PostTile dentro.
   Tipografía Satoshi/Inter, cells refinados con borders y glow.
   ──────────────────────────────────────────────────────────────────── */

import { PostTile } from "./post-tile";

type Props = {
  lit: number; // 0-30
  mobile?: boolean;
  showHeader?: boolean;
  glow?: boolean; // acto 4: bordes con glow cobalt
  className?: string;
  style?: React.CSSProperties;
};

const WEEKDAYS_ES = ["L", "M", "X", "J", "V", "S", "D"];

export function CalendarGrid({ lit, mobile = false, showHeader = true, glow = false, className = "", style = {} }: Props) {
  const cols = mobile ? 5 : 6;
  const rows = mobile ? 6 : 5;
  const total = cols * rows;
  const cellSize = mobile ? 48 : 70;
  const gap = mobile ? 6 : 8;

  return (
    <div
      className={`relative ${className}`}
      style={{
        background: "rgba(255,255,255,0.72)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        border: glow ? "1px solid rgba(168,218,220,0.50)" : "1px solid rgba(0,0,0,0.06)",
        borderRadius: 20,
        padding: mobile ? 16 : 24,
        boxShadow: glow
          ? `0 32px 64px -16px rgba(168,218,220,0.30), 0 0 0 1px rgba(168,218,220,0.20), inset 0 1px 0 rgba(255,255,255,0.8)`
          : `0 24px 64px -16px rgba(29,29,31,0.16), inset 0 1px 0 rgba(255,255,255,0.8)`,
        ...style,
      }}
    >
      {showHeader && (
        <div className="flex items-center justify-between mb-4">
          <div
            className="text-sm font-semibold"
            style={{ color: "#1D1D1F", fontFamily: "Satoshi, Inter, system-ui, sans-serif", letterSpacing: "-0.01em" }}
          >
            Abril 2026
          </div>
          <div className="flex items-center gap-2 text-xs font-medium" style={{ color: "#48484A" }}>
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{
                background: glow ? "#7DBCBE" : "#86868B",
                boxShadow: glow ? "0 0 8px rgba(168,218,220,0.6)" : "none",
              }}
            />
            {lit} {lit === 1 ? "post programado" : "posts programados"}
          </div>
        </div>
      )}

      {/* Weekday header */}
      <div className="grid mb-2" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gap }}>
        {WEEKDAYS_ES.slice(0, cols).map((d) => (
          <div
            key={d}
            className="text-center text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: "#86868B" }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Cells grid */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
          gap,
        }}
      >
        {Array.from({ length: total }).map((_, i) => {
          const isLit = i < lit;
          const day = i + 1;
          return (
            <motion.div
              key={i}
              className="relative"
              style={{
                width: cellSize,
                height: cellSize,
                borderRadius: 10,
                background: isLit ? "rgba(168,218,220,0.14)" : "rgba(245,245,247,0.4)",
                border: isLit ? "1px solid rgba(168,218,220,0.55)" : "1px solid rgba(134,134,139,0.22)",
                boxShadow: isLit
                  ? "inset 0 0 0 0.5px rgba(168,218,220,0.40), 0 0 12px rgba(168,218,220,0.20)"
                  : "none",
                overflow: "hidden",
              }}
              animate={isLit ? { scale: [0.85, 1.05, 1] } : { scale: 1 }}
              transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
            >
              {/* Day number top-left */}
              <span
                className="absolute top-1 left-1.5 text-[9px] font-semibold"
                style={{
                  color: isLit ? "#1D1D1F" : "#86868B",
                  fontFamily: "Satoshi, Inter, system-ui, sans-serif",
                }}
              >
                {day}
              </span>

              {/* Mini PostTile — solo si está iluminado */}
              {isLit && (
                <div className="absolute inset-1.5 top-4 flex items-center justify-center">
                  <PostTile
                    index={i}
                    size={cellSize - 16}
                    style={{ borderRadius: 6 }}
                  />
                </div>
              )}

              {/* Empty state dot */}
              {!isLit && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span
                    className="h-1 w-1 rounded-full"
                    style={{ background: "rgba(134,134,139,0.30)" }}
                  />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
