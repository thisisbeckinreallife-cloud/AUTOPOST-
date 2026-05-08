import type { Metadata } from "next";

/**
 * /lab/* — laboratorio de previews y showcases (no productivo).
 * Toda subruta hereda noindex/nofollow para evitar indexación.
 */
export const metadata: Metadata = {
  title: "Lab · Autopost",
  description: "Laboratorio interno de previews. No es producto público.",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function LabLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
