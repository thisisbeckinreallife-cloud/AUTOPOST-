"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function StickyCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling past the hero (1 viewport height)
      setVisible(window.scrollY > window.innerHeight);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className={`sticky-cta md:hidden ${visible ? "visible" : ""}`}>
      <Link
        href="/signup"
        className="flex items-center justify-center gap-2 w-full bg-gradient-brand-vivid text-white font-semibold py-3.5 rounded-xl text-sm shadow-glow-sm"
      >
        Programar mi primer mes — Gratis
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
