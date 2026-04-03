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
      className="fixed left-0 top-0 h-full w-64 glass-strong text-white flex flex-col z-40"
      onKeyDown={handleKeyDown}
    >
      {/* Logo with glow */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-white/5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/20 to-brand-600/20 border border-brand-500/20 animate-glow-ping">
          <Zap className="h-5 w-5 text-brand-400" />
        </div>
        <div>
          <span className="font-bold text-lg tracking-tight text-white">
            Auto<span className="text-gradient">Post</span>
          </span>
          <p className="text-[10px] text-slate-600 -mt-0.5 tracking-widest uppercase">Scheduler</p>
        </div>
      </div>

      {/* Nav */}
      <nav aria-label="Navegacion principal" className="flex-1 px-3 py-5 space-y-1">
        {navItems.map(({ href, label, icon: Icon }, i) => {
          const isActive = pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                `group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 animate-stagger-in delay-${i}`,
                isActive
                  ? "bg-gradient-to-r from-brand-500/15 to-brand-500/5 text-brand-400 shadow-[inset_3px_0_0_0] shadow-brand-400"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200 hover:translate-x-1"
              )}
            >
              <Icon className={cn(
                "h-[18px] w-[18px] transition-all duration-300",
                isActive ? "text-brand-400" : "group-hover:text-brand-400 group-hover:scale-110"
              )} />
              {label}
              {isActive && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-400 animate-glow-ping" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-white/5 space-y-1">
        <button
          onClick={toggleLocale}
          className="group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-500 hover:bg-white/5 hover:text-slate-300 transition-all duration-200"
          title={locale === "es" ? "Switch to English" : "Cambiar a Espanol"}
        >
          <Globe className="h-[18px] w-[18px] group-hover:rotate-180 transition-transform duration-500" />
          {locale === "es" ? "English" : "Espanol"}
        </button>
        <a
          href="https://help.instagram.com"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-500 hover:bg-white/5 hover:text-slate-300 transition-all duration-200"
        >
          <HelpCircle className="h-[18px] w-[18px] group-hover:scale-110 transition-transform" />
          {locale === "es" ? "Ayuda" : "Help"}
        </a>
        <button
          onClick={handleLogout}
          className="group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
        >
          <LogOut className="h-[18px] w-[18px] group-hover:scale-110 group-hover:-translate-x-0.5 transition-all duration-200" />
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
        className="fixed top-4 left-4 z-50 md:hidden flex h-11 w-11 items-center justify-center rounded-xl glass text-slate-300 hover:text-white hover:scale-105 transition-all"
        aria-label={mobileOpen ? "Cerrar menu" : "Abrir menu"}
        aria-expanded={mobileOpen}
        aria-controls="mobile-sidebar"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Desktop sidebar */}
      <div className="hidden md:block">{sidebar}</div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30 md:hidden animate-fade-in"
            onClick={() => setMobileOpen(false)}
          />
          <div id="mobile-sidebar" className="md:hidden animate-slide-left">{sidebar}</div>
        </>
      )}
    </>
  );
}
