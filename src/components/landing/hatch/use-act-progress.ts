"use client";

import { useTransform, type MotionValue } from "framer-motion";

/* ────────────────────────────────────────────────────────────────────
   useActProgress — descompone scrollYProgress (0-1) en 4 actos con
   cross-fade solapado para evitar parpadeos. Cada acto devuelve un
   MotionValue<number> de 0 a 1 (su opacidad / progreso interno).
   ──────────────────────────────────────────────────────────────────── */

export function useActProgress(p: MotionValue<number>) {
  // Opacity ranges — cross-fade solapado de 5% entre actos
  const act1 = useTransform(p, [0, 0.20, 0.27], [1, 1, 0]);
  const act2 = useTransform(p, [0.22, 0.27, 0.47, 0.52], [0, 1, 1, 0]);
  const act3 = useTransform(p, [0.47, 0.52, 0.72, 0.77], [0, 1, 1, 0]);
  const act4 = useTransform(p, [0.72, 0.77, 1], [0, 1, 1]);

  /* Inner progress — alineado con el rango de visibilidad del acto
     (antes había desfase: act4 empezaba en 0.72 pero act4Inner en 0.75). */
  const act1Inner = useTransform(p, [0, 0.22], [0, 1]);
  const act2Inner = useTransform(p, [0.22, 0.47], [0, 1]);
  const act3Inner = useTransform(p, [0.47, 0.72], [0, 1]);
  const act4Inner = useTransform(p, [0.72, 1], [0, 1]);

  return {
    act1, act2, act3, act4,
    act1Inner, act2Inner, act3Inner, act4Inner,
  };
}

/* Helper para pointer-events derivado: solo activos cuando el acto está visible */
export function visibilityPointerEvents(p: MotionValue<number>): MotionValue<string> {
  return useTransform(p, [0, 0.5, 1], ["none", "none", "auto"]);
}
