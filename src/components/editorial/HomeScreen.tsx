"use client";

import * as React from "react";
import { Logo, Avatar, ChannelChip, type IconName } from "./atoms";
import { useI18n, LangSwitcher } from "./i18n";

interface KPI {
  n: string;
  l: string;
  d: string;
}

interface PostRow {
  time: string;
  ch: IconName;
  t: string;
  state: string;
  col: string;
}

interface ChannelRow {
  ch: IconName;
  n: string;
  f: string;
}

export const HomeScreen: React.FC = () => {
  const { t } = useI18n();

  const kpis: KPI[] = [
    { n: "1,284", l: t("kpi.posts"), d: "+12%" },
    { n: "18h", l: t("kpi.saved"), d: "+4h" },
    { n: "6.4%", l: t("kpi.eng"), d: "+1.2pp" },
    { n: "847K", l: t("kpi.reach"), d: "+22%" },
  ];

  const posts: PostRow[] = [
    {
      time: "14:30",
      ch: "instagram",
      t: t("tp1.t"),
      state: t("state.live"),
      col: "var(--ap-stamp)",
    },
    {
      time: "16:00",
      ch: "twitter",
      t: t("tp2.t"),
      state: t("state.ready"),
      col: "var(--ap-ink-4)",
    },
    {
      time: "18:00",
      ch: "linkedin",
      t: t("tp3.t"),
      state: t("state.ready"),
      col: "var(--ap-ink-4)",
    },
    {
      time: "20:00",
      ch: "tiktok",
      t: t("tp4.t"),
      state: t("state.gen"),
      col: "var(--ap-mustard)",
    },
  ];

  const channels: ChannelRow[] = [
    { ch: "instagram", n: "@loma.studio", f: "24,812" },
    { ch: "linkedin", n: "Loma Studio", f: "8,402" },
    { ch: "twitter", n: "@lomastudio", f: "12,114" },
    { ch: "tiktok", n: "@loma", f: "6,700" },
  ];

  const sidebarItems = [
    { n: t("sb.today"), active: true },
    { n: t("sb.calendar") },
    { n: t("sb.composer") },
    { n: t("sb.library") },
    { n: t("sb.performance") },
    { n: t("sb.inbox"), count: 3 },
  ];

  return (
    <div
      className="ap-root"
      style={{
        height: "100%",
        minHeight: "100vh",
        overflow: "auto",
        background: "var(--ap-paper)",
        position: "relative",
      }}
    >
      <div
        style={{
          padding: "18px 36px",
          display: "flex",
          alignItems: "center",
          gap: 20,
          borderBottom: "1px solid var(--ap-line)",
        }}
      >
        <Logo size={16} />
        <span style={{ flex: 1 }} />
        <LangSwitcher />
        <span style={{ width: 1, height: 14, background: "var(--ap-line-2)" }} />
        <span
          className="ap-mono"
          style={{
            fontSize: 10,
            color: "var(--ap-ink-4)",
            letterSpacing: "0.1em",
          }}
        >
          {t("dash.date")}
        </span>
        <Avatar initials="LV" size={22} />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "170px 1fr",
          minHeight: "calc(100% - 53px)",
        }}
      >
        <aside
          style={{
            padding: "32px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 28,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {sidebarItems.map((it) => (
              <div
                key={it.n}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "5px 0",
                  fontSize: 14,
                  color: it.active ? "var(--ap-ink)" : "var(--ap-ink-4)",
                  fontWeight: it.active ? 500 : 400,
                  cursor: "pointer",
                }}
              >
                <span
                  style={
                    it.active
                      ? { borderBottom: "1px solid var(--ap-stamp)", paddingBottom: 1 }
                      : undefined
                  }
                >
                  {it.n}
                </span>
                {it.count != null && (
                  <span
                    className="ap-mono"
                    style={{ fontSize: 10, color: "var(--ap-ink-4)" }}
                  >
                    {it.count}
                  </span>
                )}
              </div>
            ))}
          </div>
        </aside>

        <main style={{ padding: "48px 56px 56px", maxWidth: 980 }}>
          <div style={{ marginBottom: 48 }}>
            <div
              className="ap-mono"
              style={{
                fontSize: 10,
                color: "var(--ap-ink-4)",
                letterSpacing: "0.14em",
                marginBottom: 14,
              }}
            >
              {t("home.kicker")}
            </div>
            <h1
              className="ap-display"
              style={{
                fontSize: 56,
                margin: "0 0 8px",
                letterSpacing: "-0.02em",
              }}
            >
              {t("home.greet.a")}{" "}
              <span style={{ fontStyle: "italic" }}>{t("home.greet.b")}</span>
            </h1>
            <p style={{ fontSize: 14, color: "var(--ap-ink-3)", margin: 0 }}>
              {t("home.greet.sub")}
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 32,
              marginBottom: 56,
              paddingBottom: 32,
              borderBottom: "1px solid var(--ap-line)",
            }}
          >
            {kpis.map((k) => (
              <div key={k.l}>
                <div
                  className="ap-display"
                  style={{
                    fontSize: 42,
                    fontStyle: "italic",
                    lineHeight: 1,
                    color: "var(--ap-ink)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {k.n}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 8,
                    marginTop: 10,
                  }}
                >
                  <span style={{ fontSize: 12, color: "var(--ap-ink-3)" }}>
                    {k.l}
                  </span>
                  <span
                    className="ap-mono"
                    style={{ fontSize: 10, color: "var(--ap-olive)" }}
                  >
                    {k.d}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.5fr 1fr",
              gap: 56,
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  marginBottom: 24,
                }}
              >
                <h2
                  className="ap-display"
                  style={{ fontSize: 22, margin: 0, fontStyle: "italic" }}
                >
                  {t("today.title")}
                </h2>
                <span
                  className="ap-mono"
                  style={{
                    fontSize: 10,
                    color: "var(--ap-ink-4)",
                    letterSpacing: "0.1em",
                  }}
                >
                  {t("today.scheduled")}
                </span>
              </div>
              {posts.map((p, i, a) => (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "64px 20px 1fr auto",
                    gap: 16,
                    padding: "18px 0",
                    borderBottom:
                      i < a.length - 1 ? "1px solid var(--ap-line)" : "none",
                    alignItems: "center",
                  }}
                >
                  <div
                    className="ap-mono"
                    style={{ fontSize: 12, color: "var(--ap-ink-3)" }}
                  >
                    {p.time}
                  </div>
                  <ChannelChip channel={p.ch} size={16} />
                  <div style={{ fontSize: 14, color: "var(--ap-ink)" }}>
                    {p.t}
                  </div>
                  <span
                    style={{ fontSize: 11, color: p.col, fontStyle: "italic" }}
                  >
                    {p.state}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
              <div>
                <div
                  className="ap-mono"
                  style={{
                    fontSize: 10,
                    color: "var(--ap-stamp)",
                    letterSpacing: "0.14em",
                    marginBottom: 10,
                  }}
                >
                  {t("sug.label")}
                </div>
                <div
                  className="ap-display"
                  style={{
                    fontSize: 22,
                    fontStyle: "italic",
                    lineHeight: 1.25,
                    color: "var(--ap-ink)",
                    marginBottom: 14,
                  }}
                >
                  {t("sug.body")}
                </div>
                <div style={{ display: "flex", gap: 14 }}>
                  <span
                    style={{
                      fontSize: 12,
                      color: "var(--ap-stamp)",
                      cursor: "pointer",
                      borderBottom: "1px solid var(--ap-stamp)",
                      paddingBottom: 1,
                    }}
                  >
                    {t("sug.now")}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      color: "var(--ap-ink-4)",
                      cursor: "pointer",
                    }}
                  >
                    {t("sug.later")}
                  </span>
                </div>
              </div>

              <div>
                <div
                  className="ap-mono"
                  style={{
                    fontSize: 10,
                    color: "var(--ap-ink-4)",
                    letterSpacing: "0.14em",
                    marginBottom: 14,
                  }}
                >
                  {t("ch.label")}
                </div>
                {channels.map((c, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "9px 0",
                    }}
                  >
                    <ChannelChip channel={c.ch} size={16} />
                    <span style={{ flex: 1, fontSize: 13, color: "var(--ap-ink)" }}>
                      {c.n}
                    </span>
                    <span
                      className="ap-mono"
                      style={{ fontSize: 11, color: "var(--ap-ink-4)" }}
                    >
                      {c.f}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
