import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AutoPost — Instagram Scheduler",
  description: "Multi-business Instagram scheduling via Meta official API",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
