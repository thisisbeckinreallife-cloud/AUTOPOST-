import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

const SITE_URL = "https://autopost-production-cd57.up.railway.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "AutoPost — La carpeta es el calendario.",
  description:
    "Una semana de posts, escrita antes del café. Sueltas la carpeta. AutoPost detecta carruseles, extrae el copy y programa 30 días en 2 minutos. Vía API oficial de Meta.",
  applicationName: "AutoPost",
  authors: [{ name: "AutoPost" }],
  keywords: [
    "scheduler instagram",
    "programar posts instagram",
    "automatización instagram",
    "carruseles instagram",
    "social media manager",
    "agencia instagram",
    "programar carrusel",
    "API Meta oficial",
  ],
  openGraph: {
    title: "AutoPost — La carpeta es el calendario.",
    description:
      "Sueltas la carpeta. AutoPost detecta carruseles, extrae el copy y programa 30 días. Una herramienta editorial para Instagram, hecha para agencias y creadores hispanohablantes.",
    type: "website",
    url: SITE_URL,
    siteName: "AutoPost",
    locale: "es_ES",
  },
  twitter: {
    card: "summary_large_image",
    title: "AutoPost — La carpeta es el calendario.",
    description:
      "30 días de Instagram programados en 2 minutos. Detectamos carruseles, extraemos copy y publicamos vía API oficial de Meta.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <meta name="theme-color" content="#F1ECE2" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Editorial display + body + mono — preload del display que es LCP */}
        <link
          rel="preload"
          as="style"
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        {/* Rebrand (Fase 1): Geist Sans + Geist Mono — fallback automático a Inter
            si bloquea (font-family declarado en globals.css con cascade). */}
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
