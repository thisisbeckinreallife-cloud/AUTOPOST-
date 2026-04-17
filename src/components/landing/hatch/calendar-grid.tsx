"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PostTile } from "./post-tile";

/* ────────────────────────────────────────────────────────────────────
   CalendarGrid v2 — grid 7-col tradicional de calendario.
   Headers L M X J V S D (ES). Days 1-30. Lit progresivo via prop.
   Interactive: clickar un día lit abre popover con broma sobre el post.
   Minimalista premium · paleta Aluminum Studio.
   ──────────────────────────────────────────────────────────────────── */

const HATCH = {
  graphite: "#1D1D1F",
  graphiteAlt: "#2C2C2E",
  athens: "#F5F5F7",
  surfAlt: "#E8E8ED",
  silver: "#86868B",
  silverDark: "#48484A",
  glow: "#A8DADC",
  cobalt: "#7DBCBE",
};

const DAY_HEADERS = ["L", "M", "X", "J", "V", "S", "D"];

/* Primer día del grid = lunes 1 (Abril 2026 empieza en miércoles pero
   normalizamos para que sea visualmente limpio — 30 días consecutivos) */

/* 30 bromas sobre posts de Instagram — tono cercano + premium sutil */
const POST_JOKES: Array<{ type: string; title: string; time: string; emoji: string }> = [
  { type: "Reel", title: "Dando de comer a mi abuela", time: "09:00", emoji: "🧓" },
  { type: "Post", title: "El aguacate perfecto", time: "12:30", emoji: "🥑" },
  { type: "Carrusel", title: "Outfit del lunes (otra vez)", time: "18:00", emoji: "👗" },
  { type: "Reel", title: "Mi perro haciendo nada", time: "10:00", emoji: "🐕" },
  { type: "Post", title: "Sunset que todos ya han subido", time: "20:30", emoji: "🌅" },
  { type: "Carrusel", title: "5 razones para dormir más", time: "08:00", emoji: "😴" },
  { type: "Reel", title: "Receta que nunca voy a cocinar", time: "13:00", emoji: "🍳" },
  { type: "Post", title: "Cita motivacional sin fuente", time: "07:30", emoji: "💬" },
  { type: "Carrusel", title: "My daily routine (ficción)", time: "09:15", emoji: "☀️" },
  { type: "Reel", title: "Haciendo como que trabajo", time: "11:00", emoji: "💻" },
  { type: "Post", title: "Café con latte art torcido", time: "10:30", emoji: "☕" },
  { type: "Carrusel", title: "Libros que no he leído", time: "17:00", emoji: "📚" },
  { type: "Reel", title: "Gato vibrando con música", time: "16:00", emoji: "🎵" },
  { type: "Post", title: "Mis piernas en la playa", time: "14:30", emoji: "🏖" },
  { type: "Carrusel", title: "Sitios que nunca visitaré", time: "19:00", emoji: "✈️" },
  { type: "Reel", title: "Ruido blanco estético", time: "22:00", emoji: "🎧" },
  { type: "Post", title: "Mi workspace (caos oculto)", time: "09:45", emoji: "🪴" },
  { type: "Carrusel", title: "Despensa aesthetic (dura 2h)", time: "11:30", emoji: "🫙" },
  { type: "Reel", title: "Manos haciendo cosas importantes", time: "15:00", emoji: "🤲" },
  { type: "Post", title: "Flatlay con demasiadas flores", time: "13:30", emoji: "🌸" },
  { type: "Carrusel", title: "Cómo medito (no medito)", time: "07:00", emoji: "🧘" },
  { type: "Reel", title: "GRWM (llego tarde)", time: "08:30", emoji: "💄" },
  { type: "Post", title: "El desayuno más instagrameable", time: "09:30", emoji: "🥐" },
  { type: "Carrusel", title: "What's in my bag: caos", time: "16:30", emoji: "👜" },
  { type: "Reel", title: "My wine o'clock", time: "21:00", emoji: "🍷" },
  { type: "Post", title: "Berries con photoshop", time: "10:15", emoji: "🍓" },
  { type: "Carrusel", title: "Mi ex llorando (ficción)", time: "20:00", emoji: "💔" },
  { type: "Reel", title: "Outfit de oficina que no uso", time: "08:15", emoji: "💼" },
  { type: "Post", title: "Autofoto fingiendo no darme cuenta", time: "17:30", emoji: "📸" },
  { type: "Carrusel", title: "Paisaje que ya subió tu prima", time: "18:45", emoji: "🏔" },
];

type Props = {
  lit: number;          // 0-30
  mobile?: boolean;
  showHeader?: boolean;
  glow?: boolean;       // act 4: borders con glow cobalt
  interactive?: boolean; // act 4: click days lit → popover con broma
  className?: string;
  style?: React.CSSProperties;
};

export function CalendarGrid({
  lit,
  mobile = false,
  showHeader = true,
  glow = false,
  interactive = false,
  className = "",
  style = {},
}: Props) {
  const [openDay, setOpenDay] = useState<number | null>(null);

  const cellSize = mobile ? 36 : 48;
  const gap = mobile ? 4 : 6;

  return (
    <div
      className={`relative ${className}`}
      style={{
        background: "rgba(255,255,255,0.78)",
        backdropFilter: "blur(22px) saturate(180%)",
        WebkitBackdropFilter: "blur(22px) saturate(180%)",
        border: glow ? `1px solid rgba(168,218,220,0.45)` : `1px solid rgba(29,29,31,0.07)`,
        borderRadius: 24,
        padding: mobile ? 14 : 20,
        boxShadow: glow
          ? `0 32px 64px -16px rgba(168,218,220,0.28), 0 0 0 1px rgba(168,218,220,0.18), inset 0 1px 0 rgba(255,255,255,0.85)`
          : `0 20px 48px -14px rgba(29,29,31,0.14), inset 0 1px 0 rgba(255,255,255,0.82)`,
        ...style,
      }}
    >
      {/* Inner frame — premium double-border look */}
      <div
        style={{
          borderRadius: 18,
          padding: mobile ? 10 : 14,
          border: "1px solid rgba(165,174,184,0.14)",
          boxShadow: "inset 0 1.5px 1.5px rgba(165,174,184,0.18)",
          background: "transparent",
        }}
      >
        {showHeader && (
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span
                className="text-sm font-semibold"
                style={{
                  color: HATCH.graphite,
                  fontFamily: "Satoshi, Inter, system-ui, sans-serif",
                  letterSpacing: "-0.01em",
                }}
              >
                Abril 2026
              </span>
              <span
                className="h-1 w-1 rounded-full"
                style={{ background: glow ? HATCH.cobalt : HATCH.silver }}
              />
              <span className="text-xs" style={{ color: HATCH.silver }}>
                {lit} {lit === 1 ? "post" : "posts"}
              </span>
            </div>
            {interactive && (
              <span
                className="text-[9px] font-semibold tracking-wider uppercase"
                style={{ color: HATCH.silver }}
              >
                click para ver
              </span>
            )}
          </div>
        )}

        {/* Day name headers */}
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(7, ${cellSize}px)`,
            gap,
            marginBottom: gap,
          }}
        >
          {DAY_HEADERS.map((d) => (
            <div
              key={d}
              className="flex items-center justify-center"
              style={{
                height: 18,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.08em",
                color: HATCH.silver,
                fontFamily: "Satoshi, Inter, system-ui, sans-serif",
              }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Days 1-30 in calendar grid — 5 rows x 7 cols */}
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(7, ${cellSize}px)`,
            gap,
          }}
        >
          {Array.from({ length: 30 }).map((_, i) => {
            const day = i + 1;
            const isLit = i < lit;
            return (
              <CalendarCell
                key={i}
                day={day}
                index={i}
                size={cellSize}
                isLit={isLit}
                interactive={interactive && isLit}
                isOpen={openDay === day}
                onToggle={() => setOpenDay(openDay === day ? null : day)}
                onClose={() => setOpenDay(null)}
                mobile={mobile}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Single day cell ─────────────────────────────────────────────── */
function CalendarCell({
  day, index, size, isLit, interactive, isOpen, onToggle, onClose, mobile,
}: {
  day: number;
  index: number;
  size: number;
  isLit: boolean;
  interactive: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  mobile: boolean;
}) {
  const joke = POST_JOKES[index % POST_JOKES.length];

  return (
    <div className="relative">
      <motion.button
        type="button"
        onClick={interactive ? onToggle : undefined}
        className="relative w-full h-full"
        style={{
          width: size,
          height: size,
          borderRadius: 12,
          background: isLit ? HATCH.graphite : "transparent",
          border: isLit
            ? `1px solid ${HATCH.graphite}`
            : `1px solid rgba(165,174,184,0.18)`,
          color: isLit ? HATCH.athens : HATCH.silver,
          cursor: interactive ? "pointer" : "default",
          overflow: "hidden",
          boxShadow: isLit
            ? "0 4px 10px -2px rgba(29,29,31,0.22), inset 0 1px 0 rgba(255,255,255,0.06)"
            : "none",
          transition: "transform 180ms cubic-bezier(0.16,1,0.3,1)",
        }}
        whileHover={interactive ? { scale: 1.06 } : {}}
        whileTap={interactive ? { scale: 0.94 } : {}}
        animate={isLit ? { scale: [0.9, 1.04, 1] } : { scale: 1 }}
        transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
        aria-label={interactive ? `Ver post del día ${day}` : undefined}
      >
        {/* Mini thumbnail when lit — appears below the day number */}
        {isLit && (
          <div className="absolute inset-0 flex items-center justify-center">
            <PostTile
              index={index}
              size={size - 10}
              style={{
                borderRadius: 8,
                opacity: 0.92,
              }}
            />
          </div>
        )}

        {/* Day number on top-left corner */}
        <span
          className="absolute top-1 left-1.5"
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: isLit ? "rgba(255,255,255,0.95)" : HATCH.silver,
            fontFamily: "Satoshi, Inter, system-ui, sans-serif",
            textShadow: isLit ? "0 1px 2px rgba(0,0,0,0.35)" : "none",
            zIndex: 2,
          }}
        >
          {day}
        </span>

        {/* Cobalt dot indicator when interactive + lit (signals clickability) */}
        {interactive && (
          <span
            className="absolute top-1 right-1 h-1 w-1 rounded-full"
            style={{
              background: HATCH.glow,
              boxShadow: `0 0 4px ${HATCH.glow}`,
            }}
          />
        )}
      </motion.button>

      {/* Popover with joke — anchored above/below the cell */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Click-outside backdrop (invisible) */}
            <div
              className="fixed inset-0 z-40"
              onClick={onClose}
              style={{ background: "transparent" }}
            />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.94 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="absolute z-50"
              style={{
                top: size + 8,
                left: "50%",
                translate: "-50% 0",
                width: mobile ? 220 : 260,
              }}
            >
              {/* Arrow */}
              <div
                className="absolute left-1/2 -translate-x-1/2 -top-1.5 w-3 h-3 rotate-45"
                style={{
                  background: "rgba(255,255,255,0.95)",
                  border: "1px solid rgba(29,29,31,0.08)",
                  borderRight: "none",
                  borderBottom: "none",
                }}
              />
              <div
                className="relative rounded-2xl overflow-hidden"
                style={{
                  background: "rgba(255,255,255,0.96)",
                  backdropFilter: "blur(20px) saturate(180%)",
                  WebkitBackdropFilter: "blur(20px) saturate(180%)",
                  border: "1px solid rgba(29,29,31,0.08)",
                  boxShadow:
                    "0 24px 48px -16px rgba(29,29,31,0.22), 0 0 0 1px rgba(168,218,220,0.15), inset 0 1px 0 rgba(255,255,255,0.9)",
                  padding: "14px 16px",
                }}
              >
                {/* Type badge + time */}
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                    style={{
                      background: `${HATCH.glow}28`,
                      color: HATCH.cobalt,
                      border: `1px solid ${HATCH.glow}50`,
                    }}
                  >
                    <span className="text-[8px]">{joke.emoji}</span>
                    {joke.type}
                  </span>
                  <span
                    className="text-[10px] font-mono"
                    style={{ color: HATCH.silver }}
                  >
                    {joke.time}
                  </span>
                </div>
                {/* Title */}
                <div
                  className="text-sm font-semibold leading-snug"
                  style={{
                    color: HATCH.graphite,
                    fontFamily: "Satoshi, Inter, system-ui, sans-serif",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {joke.title}
                </div>
                {/* Meta row */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{ borderColor: "rgba(29,29,31,0.06)" }}>
                  <span className="text-[10px]" style={{ color: HATCH.silver }}>
                    Abril {day} · programado
                  </span>
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-semibold"
                    style={{ color: HATCH.cobalt }}
                  >
                    <span className="h-1 w-1 rounded-full" style={{ background: HATCH.cobalt }} />
                    listo
                  </span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
