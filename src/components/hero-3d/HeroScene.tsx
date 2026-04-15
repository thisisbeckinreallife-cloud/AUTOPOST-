"use client";

import { Suspense, useRef, useState, useEffect, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { PhoneModel } from "./PhoneModel";
import { FolderModel } from "./FolderModel";
import { GoldParticles } from "./Particles";
import { SceneLighting } from "./Lighting";
import { SceneFog } from "./Effects";

function SceneContent({ scrollProgress }: { scrollProgress: number }) {
  return (
    <>
      <SceneLighting />
      <PhoneModel />
      <FolderModel scrollProgress={scrollProgress} />
      <GoldParticles />
      <Environment preset="night" />
      <SceneFog />
    </>
  );
}

function FallbackShimmer() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-48 h-80 rounded-3xl skeleton opacity-20" />
    </div>
  );
}

export default function HeroScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [opacity, setOpacity] = useState(0);

  // Fade in after mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
      setOpacity(1);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Track scroll for folder opening animation
  const handleScroll = useCallback(() => {
    const scrollY = window.scrollY;
    const windowH = window.innerHeight;
    // Progress 0-1 over the first viewport height
    const progress = Math.min(1, Math.max(0, scrollY / windowH));
    setScrollProgress(progress);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <div
      ref={containerRef}
      className="hero-3d-canvas"
      aria-hidden="true"
      style={{
        opacity,
        transition: "opacity 0.8s ease-out",
      }}
    >
      {isVisible && (
        <Suspense fallback={<FallbackShimmer />}>
          <Canvas
            camera={{ position: [2, 0.3, 5], fov: 45 }}
            dpr={[1, 1.5]}
            gl={{
              antialias: true,
              alpha: true,
              powerPreference: "high-performance",
            }}
            style={{ background: "transparent" }}
          >
            <SceneContent scrollProgress={scrollProgress} />
          </Canvas>
        </Suspense>
      )}
    </div>
  );
}
