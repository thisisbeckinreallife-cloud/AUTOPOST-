"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function SceneLighting() {
  const pointLightRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    if (!pointLightRef.current) return;
    const t = state.clock.elapsedTime;
    // Pulsing gold light
    pointLightRef.current.intensity = 0.8 + Math.sin(t * 0.8) * 0.2;
  });

  return (
    <>
      {/* Ambient - very low, navy tone */}
      <ambientLight intensity={0.15} color="#1A1A3E" />

      {/* Key light - warm gold from upper-left */}
      <directionalLight
        position={[-3, 4, 5]}
        intensity={0.6}
        color="#FFAA00"
        castShadow={false}
      />

      {/* Rim light - violet from back-right */}
      <directionalLight
        position={[3, 2, -3]}
        intensity={0.4}
        color="#6366F1"
      />

      {/* Cyan fill from below */}
      <directionalLight
        position={[0, -3, 2]}
        intensity={0.15}
        color="#34D399"
      />

      {/* Animated point light near phone */}
      <pointLight
        ref={pointLightRef}
        position={[0, 1, 2]}
        color="#FFAA00"
        intensity={0.8}
        distance={8}
        decay={2}
      />

      {/* Back fill for depth */}
      <pointLight
        position={[-2, 0, -3]}
        color="#6366F1"
        intensity={0.3}
        distance={6}
        decay={2}
      />
    </>
  );
}
