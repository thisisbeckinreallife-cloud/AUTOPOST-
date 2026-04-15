"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";

function FloatingFile({ index, total }: { index: number; total: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const startTime = useRef(Math.random() * 10);
  const fileColors = ["#FFB800", "#7C3AED", "#06D6A0", "#FB923C", "#3B82F6"];
  const color = fileColors[index % fileColors.length];

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime + startTime.current;

    // Each file orbits slowly around the folder
    const angle = (index / total) * Math.PI * 2 + t * 0.3;
    const radius = 0.5 + Math.sin(t * 0.5 + index) * 0.1;
    const height = Math.sin(t * 0.8 + index * 0.7) * 0.3;

    ref.current.position.x = Math.cos(angle) * radius;
    ref.current.position.y = height + 0.3;
    ref.current.position.z = Math.sin(angle) * radius * 0.5;

    // Slight rotation
    ref.current.rotation.z = Math.sin(t + index) * 0.2;
    ref.current.rotation.y = t * 0.5 + index;
  });

  return (
    <mesh ref={ref}>
      <planeGeometry args={[0.22, 0.18]} />
      <meshStandardMaterial
        color={color}
        roughness={0.3}
        metalness={0.1}
        transparent
        opacity={0.85}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

export function FolderModel({ scrollProgress = 0 }: { scrollProgress: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const lidRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;

    // Idle float
    groupRef.current.position.y = Math.sin(t * 0.6) * 0.05 - 0.2;
    groupRef.current.rotation.y = Math.sin(t * 0.4) * 0.1 + 0.3;

    // Folder lid opens based on scroll (0 = closed, 1 = fully open)
    if (lidRef.current) {
      const openAngle = scrollProgress * -0.7; // radians
      lidRef.current.rotation.x = openAngle;
    }
  });

  return (
    <group ref={groupRef} position={[-0.8, -0.8, 0.5]} scale={0.8}>
      {/* Folder base */}
      <RoundedBox args={[1.2, 0.08, 0.8]} radius={0.02} smoothness={2} position={[0, 0, 0]}>
        <meshPhysicalMaterial
          color="#FFB800"
          metalness={0.2}
          roughness={0.4}
          transmission={0.15}
          thickness={0.5}
        />
      </RoundedBox>

      {/* Folder lid (hinged at back) */}
      <group position={[0, 0.04, -0.4]}>
        <mesh ref={lidRef} position={[0, 0, 0.4]}>
          <boxGeometry args={[1.2, 0.04, 0.8]} />
          <meshPhysicalMaterial
            color="#FFD040"
            metalness={0.15}
            roughness={0.35}
            transmission={0.1}
          />
        </mesh>
      </group>

      {/* Folder tab */}
      <mesh position={[-0.25, 0.06, -0.39]}>
        <boxGeometry args={[0.4, 0.06, 0.02]} />
        <meshStandardMaterial color="#E5A500" roughness={0.4} />
      </mesh>

      {/* Floating files around folder */}
      {[0, 1, 2, 3, 4].map((i) => (
        <FloatingFile key={i} index={i} total={5} />
      ))}

      {/* Folder glow */}
      <pointLight
        position={[0, 0.5, 0]}
        color="#FFB800"
        intensity={0.5}
        distance={3}
        decay={2}
      />
    </group>
  );
}
