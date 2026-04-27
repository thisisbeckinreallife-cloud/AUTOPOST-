"use client";

import * as React from "react";
import { Logo, Icon, type IconName } from "./atoms";
import { useI18n, LangSwitcher, type Lang } from "./i18n";
import { RichText } from "./RichText";

const H1_SIZE: Record<Lang, number> = { en: 168, es: 132, fr: 124, pt: 122 };

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const ease = (t: number) => 1 - Math.pow(1 - t, 3);

interface Slot {
  ch: IconName;
  fillStart: number;
}

const FocalPiece: React.FC = () => {
  const { t } = useI18n();
  const [p, setP] = React.useState(0);

  React.useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const loop = (now: number) => {
      setP(((now - t0) % 9000) / 9000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const slots: Array<Slot | null> = [
    { ch: "instagram", fillStart: 0.05 },
    { ch: "linkedin", fillStart: 0.18 },
    null,
    { ch: "twitter", fillStart: 0.32 },
    { ch: "tiktok", fillStart: 0.46 },
    null,
    null,
  ];
  const days = [
    t("day.mon"),
    t("day.tue"),
    t("day.wed"),
    t("day.thu"),
    t("day.fri"),
    t("day.sat"),
    t("day.sun"),
  ];
  const dates = ["28", "29", "30", "01", "02", "03", "04"];

  const fade = p > 0.85 ? 1 - (p - 0.85) / 0.15 : 1;

  return (
    <div
      style={{
        width: 460,
        position: "relative",
        opacity: fade,
        transition: "opacity 0s",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 18,
          opacity: 0.8,
        }}
      >
        <span
          className="ap-mono"
          style={{ fontSize: 10, color: "var(--ap-ink-4)", letterSpacing: "0.16em" }}
        >
          {t("focal.label")}
        </span>
        <span
          className="ap-mono"
          style={{ fontSize: 10, color: "var(--ap-ink-4)", letterSpacing: "0.08em" }}
        >
          —— APR 28 / MAY 04
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {slots.map((slot, i) => {
          const local = slot ? clamp01((p - slot.fillStart) / 0.18) : 0;
          const reveal = ease(local);
          const filled = local > 0.96;
          return (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "44px 36px 1fr",
                alignItems: "center",
                gap: 14,
                padding: "14px 0",
                borderBottom:
                  i < slots.length - 1 ? "1px solid var(--ap-line)" : "none",
              }}
            >
              <span
                className="ap-mono"
                style={{ fontSize: 11, color: "var(--ap-ink-4)", letterSpacing: "0.1em" }}
              >
                {days[i]}
              </span>
              <span
                className="ap-display"
                style={{
                  fontSize: 22,
                  fontStyle: "italic",
                  color: slot ? "var(--ap-ink)" : "var(--ap-ink-4)",
                  lineHeight: 1,
                }}
              >
                {dates[i]}
              </span>

              <div style={{ height: 28, position: "relative", display: "flex", alignItems: "center" }}>
                {slot && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      transform: `scaleX(${reveal})`,
                      transformOrigin: "left",
                      background: filled ? "var(--ap-ink)" : "var(--ap-ink-2)",
                      transition: "background 0.2s",
                    }}
                  />
                )}
                {slot && reveal > 0.4 && (
                  <div
                    style={{
                      position: "relative",
                      zIndex: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "0 12px",
                      width: "100%",
                      color: "var(--ap-paper)",
                      opacity: clamp01((reveal - 0.4) / 0.4),
                    }}
                  >
                    <Icon name={slot.ch} size={11} c="var(--ap-paper)" />
                    <span
                      className="ap-mono"
                      style={{
                        fontSize: 10,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        opacity: 0.85,
                      }}
                    >
                      {slot.ch === "instagram"
                        ? "INSTAGRAM · 14:30"
                        : slot.ch === "linkedin"
                          ? "LINKEDIN · 09:15"
                          : slot.ch === "twitter"
                            ? "X · 11:00"
                            : "TIKTOK · 18:30"}
                    </span>
                  </div>
                )}
                {!slot && (
                  <span
                    className="ap-mono"
                    style={{ fontSize: 10, color: "var(--ap-ink-4)", opacity: 0.5 }}
                  >
                    —
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: 13,
            color: "var(--ap-ink-3)",
            fontStyle: "italic",
          }}
        >
          {t("focal.cap")}
        </span>
        <span
          className="ap-mono"
          style={{ fontSize: 10, color: "var(--ap-stamp)", letterSpacing: "0.14em" }}
        >
          ✦ AUTOPOST
        </span>
      </div>
    </div>
  );
};

export const EditorialHero: React.FC = () => {
  const { t, lang } = useI18n();
  const h1Size = H1_SIZE[lang] ?? 140;

  return (
    <div
      className="ap-root"
      style={{
        position: "relative",
        width: "100%",
        minHeight: 1200,
        background: "var(--ap-paper)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <header style={{ display: "flex", alignItems: "center", padding: "24px 56px" }}>
        <Logo size={20} />
        <nav
          style={{
            marginLeft: 56,
            display: "flex",
            gap: 32,
            fontSize: 13,
            color: "var(--ap-ink-3)",
          }}
        >
          {(["nav.product", "nav.manifesto", "nav.pricing", "nav.customers"] as const).map((x) => (
            <span key={x} style={{ cursor: "pointer" }}>
              {t(x)}
            </span>
          ))}
        </nav>
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            gap: 18,
            alignItems: "center",
          }}
        >
          <LangSwitcher />
          <span style={{ width: 1, height: 14, background: "var(--ap-line-2)" }} />
          <span style={{ fontSize: 13, color: "var(--ap-ink-3)", cursor: "pointer" }}>
            {t("nav.signin")}
          </span>
          <button className="ap-btn ap-btn--stamp" style={{ padding: "9px 16px", fontSize: 13 }}>
            {t("nav.try")}
          </button>
        </div>
      </header>

      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 0,
          alignItems: "center",
          padding: "80px 56px 56px",
        }}
      >
        <div style={{ maxWidth: 680, paddingRight: 48 }}>
          <h1
            className="ap-display"
            style={{
              fontSize: h1Size,
              lineHeight: 0.92,
              margin: 0,
              color: "var(--ap-ink)",
              letterSpacing: "-0.025em",
            }}
          >
            <RichText
              text={t("hero.h1")}
              waveOffset={Math.round(h1Size * 0.1)}
              waveThickness={Math.max(2, Math.round(h1Size * 0.018))}
            />
          </h1>
          <p
            style={{
              fontSize: 18,
              color: "var(--ap-ink-3)",
              lineHeight: 1.55,
              margin: "40px 0 0",
              maxWidth: 440,
            }}
            dangerouslySetInnerHTML={{ __html: t("hero.lede") }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 40 }}>
            <button
              className="ap-btn ap-btn--stamp"
              style={{ padding: "14px 22px", fontSize: 14 }}
            >
              {t("hero.cta.primary")}
            </button>
            <span style={{ fontSize: 13, color: "var(--ap-ink-4)" }}>
              {t("hero.cta.note")}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <FocalPiece />
        </div>
      </div>
    </div>
  );
};
