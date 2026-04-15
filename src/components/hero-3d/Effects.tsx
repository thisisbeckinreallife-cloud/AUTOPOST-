"use client";

// Post-processing effects are achieved via CSS overlays on the canvas container
// to avoid postprocessing dependency issues with React 18.
// The bloom, vignette, and chromatic aberration are simulated in CSS in globals.css
// through the hero-3d-canvas class and its pseudo-elements.

// This component adds a subtle fog to the Three.js scene for depth
import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import * as THREE from "three";

export function SceneFog() {
  const { scene } = useThree();

  useEffect(() => {
    scene.fog = new THREE.FogExp2("#0B1120", 0.08);
    return () => {
      scene.fog = null;
    };
  }, [scene]);

  return null;
}
