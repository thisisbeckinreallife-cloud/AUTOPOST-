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
  Zap,
  Menu,
  X,
  Globe,
  FileText,
} from "lucide-react";
import { useLocale } from "@/lib/i18n";

const navItems = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/businesses", label: "Mis cuentas", icon: Building2 },
  { href: "/logs", label: "Actividad", icon: FileText },
  { href: "/settings", label: "Configuracion", icon: Settings },
];

export function Sidebar() {
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
      className="fixed left-0 top-0 h-full w-64 bg-surface-card/90 backdrop-blur-xl border-r border-white/[0.04] text-white flex flex-col z-40"
      onKeyDown={handleKeyDown}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-white/[0.04]">
        <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500/15 to-accent-violet/10 border border-brand-500/20">
          <Zap className="h-4 w-4 text-brand-400" />
        </div>
        <span className="font-display font-bold text-base tracking-tight text-white">
          Auto<span className="text-gradient">Post</span>
        </span>
      </div>

      {/* Nav */}
      <nav aria-label="Navegacion principal" className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-gradient-to-r from-brand-500/12 to-accent-violet/6 text-brand-300 border border-brand-500/10"
                  : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300 border border-transparent"
              )}
            >
              <Icon className={cn(
                "h-[18px] w-[18px] transition-colors",
                isActive ? "text-brand-400" : "text-zinc-600 group-hover:text-zinc-400"
              )} />
              {label}
              {isActive && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-400 shadow-glow-sm" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-3 border-t border-white/[0.04] space-y-0.5">
        <button
          onClick={toggleLocale}
          className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-600 hover:bg-white/[0.04] hover:text-zinc-400 transition-colors"
          title={locale === "es" ? "Switch to English" : "Cambiar a Espanol"}
        >
          <Globe className="h-[18px] w-[18px]" />
          {locale === "es" ? "English" : "Espanol"}
        </button>
        <a
          href="https://help.instagram.com"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-600 hover:bg-white/[0.04] hover:text-zinc-400 transition-colors"
        >
          <HelpCircle className="h-[18px] w-[18px]" />
          {locale === "es" ? "Ayuda" : "Help"}
        </a>
        <button
          onClick={handleLogout}
          className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-600 hover:bg-red-500/8 hover:text-red-400 transition-colors"
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
