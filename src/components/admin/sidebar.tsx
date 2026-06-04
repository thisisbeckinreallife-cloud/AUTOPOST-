"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  LogOut,
  Settings,
  HelpCircle,
  Building2,
  Menu,
  X,
  Globe,
  FileText,
  BarChart2,
  UserCircle,
} from "lucide-react";
import { useLocale } from "@/lib/i18n";

type BadgeKind = "error" | "warning";

interface SidebarStatus {
  failed24h: number;
  expiring: number;
}

const navItems: Array<{
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: (s: SidebarStatus) => { count: number; kind: BadgeKind; tooltip: string } | null;
}> = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  {
    href: "/businesses",
    label: "Mis cuentas",
    icon: Building2,
    badge: (s) =>
      s.expiring > 0
        ? {
            count: s.expiring,
            kind: "warning",
            tooltip: `${s.expiring} ${s.expiring === 1 ? "token" : "tokens"} por expirar (<7 días)`,
          }
        : null,
  },
  { href: "/metrics", label: "Métricas", icon: BarChart2 },
  {
    href: "/logs",
    label: "Actividad",
    icon: FileText,
    badge: (s) =>
      s.failed24h > 0
        ? {
            count: s.failed24h,
            kind: "error",
            tooltip: `${s.failed24h} ${s.failed24h === 1 ? "fallo" : "fallos"} en las últimas 24h`,
          }
        : null,
  },
  { href: "/account", label: "Mi cuenta", icon: UserCircle },
  { href: "/settings", label: "Configuración", icon: Settings },
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
      className="fixed left-0 top-0 h-full w-64 flex flex-col z-40"
      style={{
        background: "#12161F",
        borderRight: "1px solid rgba(232,117,89,0.10)",
        color: "#EDEFF4",
      }}
      onKeyDown={handleKeyDown}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-2.5 px-5 h-16"
        style={{ borderBottom: "1px solid rgba(232,117,89,0.08)" }}
      >
        <div
          className="relative flex h-8 w-8 items-center justify-center rounded-md"
          style={{ background: "#E87559" }}
          aria-hidden="true"
        >
          <span
            className="font-black text-[13px] leading-none"
            style={{
              color: "#1A0E0A",
              fontFamily: "var(--font-mona-sans)",
              letterSpacing: "-0.04em",
            }}
          >
            ✦
          </span>
        </div>
        <span
          className="font-bold text-sm tracking-tight"
          style={{
            color: "#EDEFF4",
            letterSpacing: "-0.01em",
            fontFamily: "var(--font-mona-sans)",
          }}
        >
          autopost<span style={{ color: "#E87559" }}>.</span>
        </span>
      </div>

      {/* Nav */}
      <nav aria-label="Navegacion principal" className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon, badge }) => {
          const isActive = pathname?.startsWith(href);
          const b = badge ? badge(status) : null;
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-1"
              style={{
                background: isActive ? "rgba(232,117,89,0.10)" : "transparent",
                border: isActive ? "1px solid rgba(232,117,89,0.22)" : "1px solid transparent",
                color: isActive ? "#EDEFF4" : "#A3ABBA",
              }}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                className="h-[18px] w-[18px] transition-colors"
                style={{ color: isActive ? "#E87559" : "#A3ABBA" }}
                aria-hidden="true"
              />
              <span className="flex-1">{label}</span>
              {b && (
                <span
                  className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full text-[10px] font-bold tabular-nums ${
                    b.kind === "error"
                      ? "bg-error text-ink-9"
                      : "bg-warning text-ink-0"
                  }`}
                  title={b.tooltip}
                  aria-label={b.tooltip}
                >
                  {b.count > 99 ? "99+" : b.count}
                </span>
              )}
              {isActive && !b && (
                <div
                  className="h-1.5 w-1.5 rounded-full"
                  style={{
                    background: "#E87559",
                    
                  }}
                  aria-hidden="true"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div
        className="px-3 py-3 space-y-0.5"
        style={{ borderTop: "1px solid rgba(232,117,89,0.08)" }}
      >
        <button
          onClick={toggleLocale}
          className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-white/[0.04]"
          style={{ color: "#A3ABBA" }}
          title={locale === "es" ? "Switch to English" : "Cambiar a Espanol"}
        >
          <Globe className="h-[18px] w-[18px]" />
          {locale === "es" ? "English" : "Espanol"}
        </button>
        <a
          href="https://help.instagram.com"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-white/[0.04]"
          style={{ color: "#A3ABBA" }}
        >
          <HelpCircle className="h-[18px] w-[18px]" />
          {locale === "es" ? "Ayuda" : "Help"}
        </a>
        <button
          onClick={handleLogout}
          className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-red-500/[0.08] hover:text-red-400"
          style={{ color: "#A3ABBA" }}
        >
          <LogOut className="h-[18px] w-[18px]" />
          {locale === "es" ? "Cerrar sesion" : "Log out"}
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-3.5 left-4 z-50 md:hidden flex h-10 w-10 items-center justify-center rounded-lg border border-white/[0.06] bg-surface-card text-zinc-400 hover:text-white transition-all"
        aria-label={mobileOpen ? "Cerrar menu" : "Abrir menu"}
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden animate-fade-in"
            onClick={() => setMobileOpen(false)}
          />
          <div id="mobile-sidebar" className="md:hidden animate-fade-in">{sidebar}</div>
        </>
      )}
    </>
  );
}
