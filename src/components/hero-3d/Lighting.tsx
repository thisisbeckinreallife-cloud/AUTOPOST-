"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Aluminum Studio scene lighting.
 * Cool industrial palette: graphite ambient + cobalt glow + plata fill.
 */
export function SceneLighting() {
  const pointLightRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    if (!pointLightRef.current) return;
    const t = state.clock.elapsedTime;
    pointLightRef.current.intensity = 0.85 + Math.sin(t * 0.8) * 0.18;
  });

  return (
    <>
      {/* Ambient — graphite low fill */}
      <ambientLight intensity={0.18} color="#1D1D1F" />

      {/* Key light — cobalt glow from upper-left */}
      <directionalLight
        position={[-3, 4, 5]}
        intensity={0.7}
        color="#A8DADC"
        castShadow={false}
      />

      {/* Rim — cobalt deep from back-right */}
      <directionalLight
        position={[3, 2, -3]}
        intensity={0.45}
        color="#7DBCBE"
      />

      {/* Cool fill from below for metallic edge */}
      <directionalLight
        position={[0, -3, 2]}
        intensity={0.18}
        color="#86868B"
      />

      {/* Animated cobalt point light near phone */}
      <pointLight
        ref={pointLightRef}
        position={[0, 1, 2]}
        color="#A8DADC"
        intensity={0.85}
        distance={8}
        decay={2}
      />

      {/* Back fill — cobalt deep for depth */}
      <pointLight
        position={[-2, 0, -3]}
        color="#7DBCBE"
        intensity={0.3}
        distance={6}
        decay={2}
      />
    </>
  );
}
