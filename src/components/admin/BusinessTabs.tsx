"use client";

/**
 * Tabs horizontales para navegación dentro del detalle del business.
 * Marcan el tab activo según la ruta actual.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";

interface Tab {
  href: string;
  label: string;
  icon: string;
}

export function BusinessTabs({ slug }: { slug: string }) {
  const pathname = usePathname() ?? "";
  const base = `/businesses/${slug}`;

  const tabs: Tab[] = [
    { href: base, label: "Resumen", icon: "◯" },
    { href: `${base}/chat`, label: "Chat IA", icon: "✦" },
    { href: `${base}/posts`, label: "Calendario", icon: "◰" },
    { href: `${base}/studio`, label: "Estudio IA", icon: "✸" },
    { href: `${base}/upload`, label: "Subir", icon: "↑" },
    { href: `${base}/settings`, label: "Configuración", icon: "⚙" },
  ];

  // Active match — más específico primero (sub-rutas tienen prioridad sobre /resumen)
  const activeIndex = (() => {
    let bestIdx = 0;
    let bestLen = -1;
    for (let i = 0; i < tabs.length; i++) {
      const tab = tabs[i];
      if (tab.href === base) {
        // Resumen solo si no hay sub-ruta
        if (pathname === base) {
          if (bestLen < base.length) {
            bestLen = base.length;
            bestIdx = i;
          }
        }
      } else if (pathname.startsWith(tab.href)) {
        if (tab.href.length > bestLen) {
          bestLen = tab.href.length;
          bestIdx = i;
        }
      }
    }
    return bestIdx;
  })();

  return (
    <nav
      aria-label="Secciones del negocio"
      style={{
        display: "flex",
        gap: 4,
        overflowX: "auto",
        margin: 0,
        paddingBottom: 0,
      }}
    >
      {tabs.map((tab, i) => {
        const active = i === activeIndex;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 18px",
              fontFamily: "var(--ap-font-mono)",
              fontSize: 11,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: active ? "var(--ap-ink)" : "var(--ap-ink-4)",
              borderBottom: active
                ? "2px solid var(--ap-stamp)"
                : "2px solid transparent",
              textDecoration: "none",
              whiteSpace: "nowrap",
              fontWeight: active ? 600 : 400,
              transition: "color 150ms ease-out, border-color 150ms ease-out",
              marginBottom: -1,
            }}
            aria-current={active ? "page" : undefined}
          >
            <span aria-hidden="true" style={{ opacity: 0.7 }}>
              {tab.icon}
            </span>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
