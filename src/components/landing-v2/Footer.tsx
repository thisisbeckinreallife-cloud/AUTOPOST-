import * as React from "react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-ink-1 border-t border-ink-3 px-6 py-16">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid md:grid-cols-[2fr_repeat(4,1fr)] gap-8 mb-12">
          <div>
            <div className="font-np-mono text-np-h3 text-ink-9 tracking-tight font-semibold mb-3">
              autopost<span className="text-pri">.</span>
            </div>
            <p className="text-np-body text-ink-7 max-w-[280px]">
              Tira la carpeta. El resto va solo.
            </p>
          </div>

          <FooterCol title="Producto" links={[
            { href: "#how", label: "Cómo funciona" },
            { href: "#features", label: "Características" },
            { href: "#pricing", label: "Precios" },
            { href: "/signup", label: "Empezar 7 días gratis" },
          ]} />

          <FooterCol title="Recursos" links={[
            { href: "#faq", label: "Preguntas" },
            { href: "/legal/terms", label: "Términos" },
            { href: "/legal/privacy", label: "Privacidad" },
          ]} />

          <FooterCol title="Cuenta" links={[
            { href: "/login", label: "Entrar" },
            { href: "/signup", label: "Crear cuenta" },
            { href: "/forgot-password", label: "Recuperar contraseña" },
          ]} />

          <FooterCol title="Soporte" links={[
            { href: "mailto:soporte@autopost.app", label: "soporte@autopost.app" },
          ]} />
        </div>

        <div className="flex items-center justify-between flex-wrap gap-4 pt-6 border-t border-ink-3 font-np-mono text-np-caption text-ink-6">
          <span>© 2026 Autopost · Todos los derechos reservados.</span>
          <span>Hecho en España</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: Array<{ href: string; label: string }>;
}) {
  return (
    <div>
      <h4 className="font-np-mono text-np-caption text-ink-6 uppercase tracking-widest mb-3">
        {title}
      </h4>
      <ul className="flex flex-col gap-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-np-body text-ink-7 hover:text-ink-9 transition-colors"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
