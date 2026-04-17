"use client";

import { useTransform, type MotionValue } from "framer-motion";

/* ────────────────────────────────────────────────────────────────────
   useActProgress — descompone scrollYProgress (0-1) en 4 actos con
   cross-fade solapado para evitar parpadeos. Cada acto devuelve un
   MotionValue<number> de 0 a 1 (su opacidad / progreso interno).
   ──────────────────────────────────────────────────────────────────── */

export function useActProgress(p: MotionValue<number>) {
  // Acto 1: 0% → 27% (fade out solapado con act2)
  const act1 = useTransform(p, [0, 0.20, 0.27], [1, 1, 0]);
  // Acto 2: 22% → 52% (fade in y out solapado con act1 y act3)
  const act2 = useTransform(p, [0.22, 0.27, 0.47, 0.52], [0, 1, 1, 0]);
  // Acto 3: 47% → 77%
  const act3 = useTransform(p, [0.47, 0.52, 0.72, 0.77], [0, 1, 1, 0]);
  // Acto 4: 72% → 100%
  const act4 = useTransform(p, [0.72, 0.77, 1], [0, 1, 1]);

  /* Inner progress de cada acto (0→1 dentro de su rango activo) — útil
     para animaciones internas que avanzan dentro del acto. */
  const act1Inner = useTransform(p, [0, 0.25], [0, 1]);
  const act2Inner = useTransform(p, [0.25, 0.50], [0, 1]);
  const act3Inner = useTransform(p, [0.50, 0.75], [0, 1]);
  const act4Inner = useTransform(p, [0.75, 1], [0, 1]);

  return {
    act1, act2, act3, act4,
    act1Inner, act2Inner, act3Inner, act4Inner,
  };
}

/* Helper para pointer-events derivado: solo activos cuando el acto está visible */
export function visibilityPointerEvents(p: MotionValue<number>): MotionValue<string> {
  return useTransform(p, [0, 0.5, 1], ["none", "none", "auto"]);
}
