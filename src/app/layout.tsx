import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Aluminum Studio — Drop a folder. Publish a month.",
  description:
    "El único scheduler de Instagram que entiende carpetas. Suéltala. Detectamos carruseles, programamos 30 días y publicamos vía API oficial de Meta.",
  openGraph: {
    title: "Aluminum Studio — Drop a folder. Publish a month.",
    description:
      "El único scheduler que entiende carpetas. Un mes de Instagram programado en 2 minutos.",
    type: "website",
    url: "https://autopost-production-cd57.up.railway.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aluminum Studio — Drop a folder. Publish a month.",
    description:
      "El único scheduler que entiende carpetas. Un mes de Instagram programado en 2 minutos.",
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
        <meta name="theme-color" content="#06080D" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,600,700,800,900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
