"use client";

import { useEffect, useRef, useState } from "react";

const TRAIL_LENGTH = 8;

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const trailRefs = useRef<HTMLDivElement[]>([]);
  const mousePos = useRef({ x: -100, y: -100 });
  const trailPositions = useRef(
    Array.from({ length: TRAIL_LENGTH }, () => ({ x: -100, y: -100 }))
  );
  const rafRef = useRef<number>(0);
  const [isHovering, setIsHovering] = useState(false);
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    // Only show on desktop with fine pointer
    const isDesktop = window.matchMedia("(pointer: fine)").matches;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setIsMobile(!isDesktop || prefersReducedMotion);

    if (!isDesktop || prefersReducedMotion) return;

    const handleMouseMove = (e: globalThis.MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseOver = (e: globalThis.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("a, button, [role=button], input, textarea, select, .card-interactive, .card-3d")) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    const animate = () => {
      // Update dot
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${mousePos.current.x - 4}px, ${mousePos.current.y - 4}px)`;
      }

      // Update trail with lerp
      for (let i = 0; i < TRAIL_LENGTH; i++) {
        const prev = i === 0 ? mousePos.current : trailPositions.current[i - 1];
        const lerpFactor = 0.15 - i * 0.012;
        trailPositions.current[i].x += (prev.x - trailPositions.current[i].x) * lerpFactor;
        trailPositions.current[i].y += (prev.y - trailPositions.current[i].y) * lerpFactor;

        const el = trailRefs.current[i];
        if (el) {
          const opacity = (1 - i / TRAIL_LENGTH) * 0.4;
          const size = 4 - (i / TRAIL_LENGTH) * 2;
          el.style.transform = `translate(${trailPositions.current[i].x - size / 2}px, ${trailPositions.current[i].y - size / 2}px)`;
          el.style.opacity = String(opacity);
          el.style.width = `${size}px`;
          el.style.height = `${size}px`;
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseover", handleMouseOver);
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  if (isMobile) return null;

  return (
    <>
      <div
        ref={dotRef}
        className={`cursor-dot ${isHovering ? "hovering" : ""}`}
      />
      {Array.from({ length: TRAIL_LENGTH }, (_, i) => (
        <div
          key={i}
          ref={(el) => {
            if (el) trailRefs.current[i] = el;
          }}
          className="cursor-trail"
        />
      ))}
    </>
  );
}
