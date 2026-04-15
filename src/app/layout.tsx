import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "AutoPost — Programa un mes de Instagram en 2 minutos",
  description:
    "Sube la carpeta. AutoPost detecta carruseles, pone el copy solo y programa 30 días de una vez.",
  openGraph: {
    title: "AutoPost — Programa un mes de Instagram en 2 minutos",
    description:
      "Sube la carpeta. AutoPost detecta carruseles, pone el copy solo y programa 30 días de una vez.",
    type: "website",
    url: "https://autopost-production-cd57.up.railway.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "AutoPost — Programa un mes de Instagram en 2 minutos",
    description:
      "Sube la carpeta. AutoPost detecta carruseles, pone el copy solo y programa 30 días de una vez.",
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
        <meta name="theme-color" content="#060609" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Inter+Tight:wght@600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
