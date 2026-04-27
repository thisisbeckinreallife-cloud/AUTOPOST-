"use client";

import * as React from "react";

export type IconName =
  | "plus"
  | "arrow"
  | "arrowUp"
  | "check"
  | "x"
  | "edit"
  | "cal"
  | "chart"
  | "grid"
  | "inbox"
  | "image"
  | "search"
  | "play"
  | "star"
  | "instagram"
  | "linkedin"
  | "twitter"
  | "tiktok"
  | "youtube";

export const Logo: React.FC<{ size?: number; dark?: boolean }> = ({
  size = 22,
  dark = false,
}) => {
  const c = dark ? "var(--ap-paper)" : "var(--ap-ink)";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "baseline",
        gap: 6,
        color: c,
        lineHeight: 1,
        fontFamily: "var(--ap-font-display)",
        fontSize: size * 1.5,
        letterSpacing: "-0.025em",
      }}
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: 0 }}>
        <span style={{ fontStyle: "italic" }}>auto</span>
        <span style={{ color: "var(--ap-stamp)", fontWeight: "inherit" }}>·</span>
        <span>post</span>
      </span>
    </span>
  );
};

export const Icon: React.FC<{
  name: IconName;
  size?: number;
  c?: string;
  sw?: number;
}> = ({ name, size = 14, c = "currentColor", sw = 1.5 }) => {
  const p = {
    fill: "none" as const,
    stroke: c,
    strokeWidth: sw,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  const map: Record<IconName, React.ReactNode> = {
    plus: <g {...p}><path d="M8 2v12M2 8h12" /></g>,
    arrow: <g {...p}><path d="M3 8h10M9 4l4 4-4 4" /></g>,
    arrowUp: <g {...p}><path d="M8 13V3M4 7l4-4 4 4" /></g>,
    check: <g {...p}><path d="M3 8.5l3 3 7-7" /></g>,
    x: <g {...p}><path d="M3.5 3.5l9 9M12.5 3.5l-9 9" /></g>,
    edit: <g {...p}><path d="M11 2.5l2.5 2.5L5 13.5H2.5V11z" /></g>,
    cal: <g {...p}><rect x="2" y="3" width="12" height="11" rx="0.5" /><path d="M2 6h12M5 1.5v3M11 1.5v3" /></g>,
    chart: <g {...p}><path d="M2 13V3M2 13h12M5 11V8M8 11V5M11 11V7" /></g>,
    grid: <g {...p}><rect x="2" y="2" width="5" height="5" /><rect x="9" y="2" width="5" height="5" /><rect x="2" y="9" width="5" height="5" /><rect x="9" y="9" width="5" height="5" /></g>,
    inbox: <g {...p}><path d="M2 9l1.5-6h9L14 9M2 9v4h12V9M2 9h4l1 1.5h2L10 9h4" /></g>,
    image: <g {...p}><rect x="2" y="2.5" width="12" height="11" rx="0.5" /><circle cx="6" cy="6.5" r="1.2" /><path d="M14 11l-3.5-3.5L4 14" /></g>,
    search: <g {...p}><circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5L14 14" /></g>,
    play: <g {...p} fill={c}><path d="M5 3.5v9l7-4.5z" /></g>,
    star: <g {...p}><path d="M8 1.5l1.6 4.4L14 7.5l-4.4 1.6L8 13.5 6.4 9.1 2 7.5l4.4-1.6z" /></g>,
    instagram: <g {...p}><rect x="2" y="2" width="12" height="12" rx="3" /><circle cx="8" cy="8" r="3" /><circle cx="11.5" cy="4.5" r=".5" fill={c} /></g>,
    linkedin: <g {...p}><rect x="2" y="2" width="12" height="12" rx="1" /><path d="M5 7v5M5 4.5v.1M8 12V7M8 9c0-1.5.7-2 2-2s2 .5 2 2v3" /></g>,
    twitter: <g {...p}><path d="M14 4.5c-.5.3-1 .4-1.5.5.5-.3.9-.8 1.1-1.4-.5.3-1 .5-1.6.6A2.4 2.4 0 0 0 8 6.4c0 .2 0 .4.1.5C5.7 6.7 3.7 5.6 2.4 4c-.3.4-.4.9-.4 1.4 0 .9.4 1.6 1.1 2-.4 0-.8-.1-1.1-.3 0 1.1.8 2.1 1.9 2.3-.3.1-.6.1-.9 0a2.4 2.4 0 0 0 2.2 1.7A4.7 4.7 0 0 1 1.5 12c1 .6 2.2 1 3.5 1 4.2 0 6.5-3.5 6.5-6.5v-.3c.4-.3.8-.7 1.1-1.1z" fill={c} stroke="none" /></g>,
    tiktok: <g {...p}><path d="M10 2v8.5a2.5 2.5 0 1 1-2.5-2.5" /><path d="M10 2c0 1.5 1 3 3 3" /></g>,
    youtube: <g {...p}><rect x="1.5" y="3.5" width="13" height="9" rx="2" /><path d="M7 6.5v3l3-1.5z" fill={c} /></g>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 16 16">
      {map[name]}
    </svg>
  );
};

export const ChannelChip: React.FC<{
  channel: IconName;
  size?: number;
}> = ({ channel, size = 20 }) => (
  <span
    style={{
      width: size,
      height: size,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      color: "var(--ap-ink)",
      flexShrink: 0,
      border: "1px solid var(--ap-ink)",
    }}
  >
    <Icon name={channel} size={size * 0.62} c="currentColor" sw={1.4} />
  </span>
);

export const Avatar: React.FC<{ initials?: string; size?: number }> = ({
  initials = "LV",
  size = 24,
}) => (
  <div
    style={{
      width: size,
      height: size,
      background: "var(--ap-stamp)",
      color: "var(--ap-paper)",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: size * 0.42,
      fontWeight: 600,
      fontFamily: "var(--ap-font-sans)",
    }}
  >
    {initials}
  </div>
);
