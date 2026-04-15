"use client";

import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { RoundedBox, Text } from "@react-three/drei";
import * as THREE from "three";

// Instagram-style post placeholder colors
const POST_COLORS = ["#FFAA00", "#6366F1", "#34D399", "#FB923C", "#3B82F6", "#F97066"];

function FeedPost({ position, color, delay }: { position: [number, number, number]; color: string; delay: number }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    // Subtle breathing
    ref.current.scale.setScalar(1 + Math.sin(t * 1.5 + delay) * 0.02);
  });

  return (
    <mesh ref={ref} position={position}>
      <planeGeometry args={[0.32, 0.32]} />
      <meshStandardMaterial color={color} roughness={0.3} metalness={0.1} />
    </mesh>
  );
}

function PhoneScreen() {
  // 3x3 grid of "posts" on the phone screen
  const posts = useMemo(() => {
    const items: { pos: [number, number, number]; color: string; delay: number }[] = [];
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 3; col++) {
        items.push({
          pos: [
            -0.34 + col * 0.34,
            0.55 - row * 0.34,
            0.076,
          ],
          color: POST_COLORS[(row * 3 + col) % POST_COLORS.length],
          delay: row * 3 + col,
        });
      }
    }
    return items;
  }, []);

  return (
    <group>
      {/* Screen background */}
      <mesh position={[0, 0.1, 0.075]}>
        <planeGeometry args={[1.05, 1.85]} />
        <meshStandardMaterial color="#06080D" roughness={0.1} metalness={0.8} />
      </mesh>

      {/* Status bar area */}
      <mesh position={[0, 0.95, 0.076]}>
        <planeGeometry args={[1.0, 0.08]} />
        <meshStandardMaterial color="#0C0F16" roughness={0.5} />
      </mesh>

      {/* Instagram header bar */}
      <mesh position={[0, 0.82, 0.076]}>
        <planeGeometry args={[1.0, 0.12]} />
        <meshStandardMaterial color="#11141C" roughness={0.5} />
      </mesh>

      {/* Feed posts grid */}
      {posts.map((p, i) => (
        <FeedPost key={i} position={p.pos} color={p.color} delay={p.delay} />
      ))}
    </group>
  );
}

export function PhoneModel() {
  const groupRef = useRef<THREE.Group>(null);
  const { pointer } = useThree();

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;

    // Idle float animation
    groupRef.current.position.y = Math.sin(t * 0.8) * 0.08;

    // Cursor-reactive tilt (subtle parallax)
    const targetRotX = -pointer.y * 0.08;
    const targetRotY = pointer.x * 0.12;
    groupRef.current.rotation.x += (targetRotX - groupRef.current.rotation.x) * 0.05;
    groupRef.current.rotation.y += (targetRotY + Math.sin(t * 0.3) * 0.05 - groupRef.current.rotation.y) * 0.05;
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]} scale={1.1}>
      {/* Phone body */}
      <RoundedBox args={[1.2, 2.1, 0.15]} radius={0.12} smoothness={4}>
        <meshPhysicalMaterial
          color="#1A1A2E"
          metalness={0.9}
          roughness={0.15}
          envMapIntensity={1.5}
          clearcoat={0.5}
          clearcoatRoughness={0.1}
        />
      </RoundedBox>

      {/* Screen bezel inner edge */}
      <RoundedBox args={[1.1, 2.0, 0.01]} radius={0.1} smoothness={4} position={[0, 0.05, 0.07]}>
        <meshStandardMaterial color="#06080D" roughness={0.2} metalness={0.5} />
      </RoundedBox>

      {/* Screen content */}
      <PhoneScreen />

      {/* Camera notch */}
      <mesh position={[0, 1.0, 0.076]}>
        <circleGeometry args={[0.04, 16]} />
        <meshStandardMaterial color="#06080D" roughness={0.1} metalness={0.9} />
      </mesh>

      {/* Side buttons */}
      <mesh position={[0.62, 0.3, 0]}>
        <boxGeometry args={[0.02, 0.15, 0.06]} />
        <meshPhysicalMaterial color="#2A2A3E" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Screen rim light (glow effect) */}
      <mesh position={[0, 0.1, 0.08]}>
        <planeGeometry args={[1.15, 2.0]} />
        <meshBasicMaterial
          color="#FFAA00"
          transparent
          opacity={0.03}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
