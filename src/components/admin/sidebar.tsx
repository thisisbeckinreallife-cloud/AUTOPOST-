"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { Logo } from "@/components/editorial/atoms";

type BadgeKind = "error" | "warning";

interface SidebarStatus {
  failed24h: number;
  expiring: number;
}

interface NavItem {
  href: string;
  label: string;
  index: string;
  badge?: (s: SidebarStatus) => { count: number; kind: BadgeKind; tooltip: string } | null;
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Hoy", index: "01" },
  {
    href: "/businesses",
    label: "Negocios",
    index: "02",
    badge: (s) =>
      s.expiring > 0
        ? {
            count: s.expiring,
            kind: "warning",
            tooltip: `${s.expiring} ${s.expiring === 1 ? "token" : "tokens"} por expirar (<7 días)`,
          }
        : null,
  },
  { href: "/posts", label: "Calendario", index: "03" },
  { href: "/metrics", label: "Métricas", index: "04" },
  {
    href: "/logs",
    label: "Bitácora",
    index: "05",
    badge: (s) =>
      s.failed24h > 0
        ? {
            count: s.failed24h,
            kind: "error",
            tooltip: `${s.failed24h} ${s.failed24h === 1 ? "fallo" : "fallos"} en 24h`,
          }
        : null,
  },
  { href: "/settings", label: "Ajustes", index: "06" },
];

export function Sidebar({
  status = { failed24h: 0, expiring: 0 },
}: {
  status?: SidebarStatus;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const locale = useLocale();

  function toggleLocale() {
    const next = locale === "es" ? "en" : "es";
    localStorage.setItem("autopost-locale", next);
    window.location.reload();
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape" && mobileOpen) setMobileOpen(false);
  }

  const sidebar = (
    <aside
      className="ap-root fixed left-0 top-0 h-full w-64 flex flex-col z-40"
      style={{
        background: "var(--ap-paper)",
        borderRight: "1px solid var(--ap-line-2)",
        color: "var(--ap-ink)",
      }}
      onKeyDown={handleKeyDown}
    >
      {/* Masthead */}
      <div
        className="flex items-center px-6"
        style={{
          height: 72,
          borderBottom: "1px solid var(--ap-line)",
        }}
      >
        <Logo size={18} />
      </div>

      {/* Volume / Issue marker — magazine masthead-feel */}
      <div
        className="px-6 py-4"
        style={{ borderBottom: "1px solid var(--ap-line)" }}
      >
        <p
          className="ap-mono"
          style={{
            margin: 0,
            fontSize: 9,
            letterSpacing: "0.16em",
            color: "var(--ap-ink-4)",
            textTransform: "uppercase",
          }}
        >
          Vol. 02 · Estudio
        </p>
        <p
          className="ap-display"
          style={{
            margin: "4px 0 0",
            fontSize: 13,
            fontStyle: "italic",
            color: "var(--ap-ink-3)",
            lineHeight: 1.1,
          }}
        >
          Drop a folder.
          <br />
          Publish a month.
        </p>
      </div>

      {/* Nav — table of contents */}
      <nav
        aria-label="Navegación principal"
        className="flex-1 px-6 py-6"
        style={{ display: "flex", flexDirection: "column" }}
      >
        {navItems.map(({ href, label, index, badge }) => {
          const isActive = pathname?.startsWith(href);
          const b = badge ? badge(status) : null;
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className="group transition-opacity hover:opacity-80"
              style={{
                display: "grid",
                gridTemplateColumns: "28px 1fr auto",
                alignItems: "baseline",
                gap: 12,
                padding: "10px 0",
                borderBottom: "1px solid var(--ap-line)",
                color: "var(--ap-ink)",
                textDecoration: "none",
              }}
              aria-current={isActive ? "page" : undefined}
            >
              <span
                className="ap-mono"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.1em",
                  color: isActive ? "var(--ap-stamp)" : "var(--ap-ink-4)",
                }}
              >
                {index}
              </span>
              <span
                style={{
                  fontSize: 14,
                  color: isActive ? "var(--ap-ink)" : "var(--ap-ink-3)",
                  fontWeight: isActive ? 500 : 400,
                  borderBottom: isActive
                    ? "1px solid var(--ap-stamp)"
                    : "1px solid transparent",
                  paddingBottom: 1,
                  width: "fit-content",
                }}
              >
                {label}
              </span>
              {b && (
                <span
                  className="ap-mono"
                  title={b.tooltip}
                  aria-label={b.tooltip}
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    color:
                      b.kind === "error"
                        ? "var(--ap-stamp)"
                        : "var(--ap-mustard)",
                  }}
                >
                  {b.count > 99 ? "99+" : b.count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Colophon */}
      <div
        className="px-6 py-4"
        style={{
          borderTop: "1px solid var(--ap-line-2)",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <button
          onClick={toggleLocale}
          className="ap-mono text-left transition-opacity hover:opacity-70"
          style={{
            fontSize: 11,
            letterSpacing: "0.1em",
            color: "var(--ap-ink-3)",
            background: "transparent",
            border: 0,
            padding: 0,
            textTransform: "uppercase",
            cursor: "pointer",
          }}
          title={locale === "es" ? "Switch to English" : "Cambiar a Español"}
        >
          {locale === "es" ? "ES" : "EN"} ·{" "}
          <span style={{ color: "var(--ap-ink-4)" }}>
            {locale === "es" ? "switch en" : "switch es"}
          </span>
        </button>
        <a
          href="https://help.instagram.com"
          target="_blank"
          rel="noopener noreferrer"
          className="transition-opacity hover:opacity-70"
          style={{
            fontSize: 12,
            color: "var(--ap-ink-3)",
            textDecoration: "none",
          }}
        >
          {locale === "es" ? "Ayuda" : "Help"}
        </a>
        <button
          onClick={handleLogout}
          className="text-left transition-opacity hover:opacity-70"
          style={{
            fontSize: 12,
            color: "var(--ap-ink-3)",
            background: "transparent",
            border: 0,
            padding: 0,
            cursor: "pointer",
          }}
        >
          {locale === "es" ? "Cerrar sesión" : "Log out"}
        </button>
        <span
          className="ap-mono"
          style={{
            marginTop: 6,
            fontSize: 9,
            letterSpacing: "0.16em",
            color: "var(--ap-ink-4)",
            textTransform: "uppercase",
          }}
        >
          ✦ MMXXVI
        </span>
      </div>
    </aside>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="ap-root fixed top-3.5 left-4 z-50 md:hidden flex h-10 w-10 items-center justify-center"
        style={{
          background: "var(--ap-paper)",
          border: "1px solid var(--ap-line-2)",
          color: "var(--ap-ink)",
        }}
        aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={mobileOpen}
        aria-controls="mobile-sidebar"
      >
        {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      {/* Desktop sidebar */}
      <div className="hidden md:block">{sidebar}</div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-30 md:hidden animate-fade-in"
            style={{ background: "rgba(20,17,13,0.45)", backdropFilter: "blur(2px)" }}
            onClick={() => setMobileOpen(false)}
          />
          <div id="mobile-sidebar" className="md:hidden animate-fade-in">
            {sidebar}
          </div>
        </>
      )}
    </>
  );
}
