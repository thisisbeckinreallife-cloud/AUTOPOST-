"use client";

import * as React from "react";

interface RichTextProps {
  text: string;
  waveOffset?: number;
  waveThickness?: number;
  strikeThickness?: number;
}

export const RichText: React.FC<RichTextProps> = ({
  text,
  waveOffset = 14,
  waveThickness = 2,
  strikeThickness = 2,
}) => {
  if (!text) return null;
  const lines = text.split("\n");

  const renderLine = (line: string, key: number) => {
    const out: React.ReactNode[] = [];
    let i = 0;
    let idx = 0;
    const re = /<(i|wave|s|em)>([\s\S]*?)<\/\1>/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(line)) !== null) {
      if (m.index > i) {
        out.push(
          <React.Fragment key={`t${key}-${idx++}`}>
            {line.slice(i, m.index)}
          </React.Fragment>,
        );
      }
      const tag = m[1];
      const inner = m[2];
      if (tag === "i" || tag === "em") {
        out.push(
          <span key={`i${key}-${idx++}`} style={{ fontStyle: "italic" }}>
            {inner}
          </span>,
        );
      } else if (tag === "wave") {
        out.push(
          <u
            key={`w${key}-${idx++}`}
            style={{
              textDecorationStyle: "wavy",
              textDecorationColor: "var(--ap-stamp)",
              textUnderlineOffset: waveOffset,
              textDecorationThickness: `${waveThickness}px`,
            }}
          >
            {inner}
          </u>,
        );
      } else if (tag === "s") {
        out.push(
          <span
            key={`s${key}-${idx++}`}
            style={{
              textDecoration: "line-through",
              textDecorationColor: "var(--ap-stamp)",
              textDecorationThickness: `${strikeThickness}px`,
            }}
          >
            {inner}
          </span>,
        );
      }
      i = m.index + m[0].length;
    }
    if (i < line.length) {
      out.push(
        <React.Fragment key={`t${key}-${idx++}`}>
          {line.slice(i)}
        </React.Fragment>,
      );
    }
    return out;
  };

  return (
    <>
      {lines.map((l, i) => (
        <React.Fragment key={i}>
          {i > 0 && <br />}
          {renderLine(l, i)}
        </React.Fragment>
      ))}
    </>
  );
};
