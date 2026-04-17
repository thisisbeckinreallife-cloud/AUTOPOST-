"use client";

/* ────────────────────────────────────────────────────────────────────
   PostTile — mock de un post de Instagram con thumbnail visual.
   Pase 1: gradients sofisticados (no Unsplash todavía — eso es pase 2 polish).
   Cada index produce un gradient y un emoji distintos para variedad visual.
   ──────────────────────────────────────────────────────────────────── */

const PALETTE_PAIRS: Array<[string, string]> = [
  ["#FFB6A3", "#FF6B9D"], // peach → pink
  ["#A8DADC", "#7DBCBE"], // cobalt soft
  ["#FFD89B", "#19547B"], // gold → deep blue
  ["#C9A96E", "#8B7355"], // champagne
  ["#1D1D1F", "#48484A"], // graphite
  ["#FAFAFC", "#86868B"], // silver
  ["#FF9A8B", "#FF6A88"], // coral
  ["#A1C4FD", "#C2E9FB"], // sky
  ["#FBC2EB", "#A6C1EE"], // lavender
  ["#FDE68A", "#F59E0B"], // amber
  ["#34D399", "#059669"], // emerald
  ["#86868B", "#1D1D1F"], // dark fade
  ["#F472B6", "#EC4899"], // pink
  ["#A78BFA", "#7C3AED"], // violet
  ["#FBA74D", "#F97316"], // orange
];

const EMOJIS = ["📸", "🌅", "✨", "🍂", "🌊", "🌸", "🍃", "☕", "🌙", "🎨", "🍓", "🌺", "🍷", "🌿", "📷"];

type Props = {
  index: number;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
};

export function PostTile({ index, size = 64, className = "", style = {} }: Props) {
  const pair = PALETTE_PAIRS[index % PALETTE_PAIRS.length];
  const emoji = EMOJIS[index % EMOJIS.length];
  const angle = ((index * 37) % 180) - 90;

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.18,
        background: `linear-gradient(${angle}deg, ${pair[0]}, ${pair[1]})`,
        boxShadow: `
          0 1px 2px rgba(0,0,0,0.10),
          0 4px 12px rgba(0,0,0,0.12),
          inset 0 0.5px 0 rgba(255,255,255,0.4),
          inset 0 -0.5px 0 rgba(0,0,0,0.10)
        `,
        border: "0.5px solid rgba(255,255,255,0.20)",
        ...style,
      }}
    >
      {/* Inner glass shine */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.06) 100%)",
        }}
      />
      {/* Emoji centered (visual placeholder for thumbnail) */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ fontSize: size * 0.42, filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.25))" }}
      >
        {emoji}
      </div>
    </div>
  );
}
