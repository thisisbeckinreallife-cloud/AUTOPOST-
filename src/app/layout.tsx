import type { Metadata } from "next";
import localFont from "next/font/local";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const SITE_URL = "https://autopost-production-cd57.up.railway.app";

/**
 * Mona Sans Variable Font (GitHub OFL).
 * Eje wght 200-900 + wdth 75-125 cubre body + UI + display en una request.
 * Archivo descargado en src/app/fonts/Mona-Sans.var.woff2 (~299KB).
 */
const monaSans = localFont({
  src: "./fonts/Mona-Sans.var.woff2",
  variable: "--font-mona-sans",
  display: "swap",
  weight: "200 900",
  style: "normal",
  declarations: [{ prop: "font-stretch", value: "75% 125%" }],
});

/**
 * JetBrains Mono — datos numéricos en pricing/dashboard, code blocks.
 * 2 pesos suficientes (400 cuerpo, 500 énfasis).
 */
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Autopost — Tira la carpeta. El resto va solo.",
  description:
    "Sube una carpeta de posts. La IA detecta formato, sugiere hora y monta el calendario. Tú apruebas. Autopost publica solo en Instagram, TikTok, X, LinkedIn, YouTube y Threads.",
  applicationName: "Autopost",
  authors: [{ name: "Autopost" }],
  keywords: [
    "scheduler instagram",
    "programar posts redes sociales",
    "automatización contenido",
    "social media manager",
    "agencia instagram",
    "IA programación posts",
    "Meta API oficial",
  ],
  openGraph: {
    title: "Autopost — Tira la carpeta. El resto va solo.",
    description:
      "Sube una carpeta de posts. La IA detecta formato, sugiere hora y monta el calendario. Tú apruebas.",
    type: "website",
    url: SITE_URL,
    siteName: "Autopost",
    locale: "es_ES",
  },
  twitter: {
    card: "summary_large_image",
    title: "Autopost — Tira la carpeta. El resto va solo.",
    description:
      "Sube una carpeta de posts. La IA detecta formato, sugiere hora y monta el calendario.",
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
    <html
      lang="es"
      className={`${monaSans.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <meta name="theme-color" content="#0E0F0D" />
      </head>
      <body className="bg-ink-1 text-ink-9 font-sans antialiased">
        <a href="#main-content" className="skip-to-content">
          Saltar al contenido
        </a>
        <Providers>
          <div id="main-content">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
