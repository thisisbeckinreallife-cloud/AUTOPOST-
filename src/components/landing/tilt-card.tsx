"use client";

import { useRef, useCallback, type ReactNode, type MouseEvent } from "react";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
  /** Enable shine sweep on hover */
  shine?: boolean;
}

export function TiltCard({ children, className = "", maxTilt = 6, shine = true }: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -maxTilt;
      const rotateY = ((x - centerX) / centerX) * maxTilt;

      // Smoother transform with scale boost
      cardRef.current.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-3px) scale(1.02)`;

      // Update spotlight position
      cardRef.current.style.setProperty("--spotlight-x", `${(x / rect.width) * 100}%`);
      cardRef.current.style.setProperty("--spotlight-y", `${(y / rect.height) * 100}%`);
    },
    [maxTilt]
  );

  const handleMouseLeave = useCallback(() => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = "perspective(1200px) rotateX(0deg) rotateY(0deg) translateY(0px) scale(1)";
  }, []);

  return (
    <div
      ref={cardRef}
      className={`card-3d ${shine ? "card-shine" : ""} ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
}
