"use client";

import { motion } from "framer-motion";
import { CheckCircle, X } from "lucide-react";
import { MotionReveal, MotionStagger, MotionStaggerItem, EASE_CINEMATIC, STAGGER } from "@/components/motion";

const features = [
  { name: "Subida masiva por carpeta/ZIP", autopost: true, later: false, buffer: false, hootsuite: false },
  { name: "Deteccion de carruseles", autopost: true, later: false, buffer: false, hootsuite: false },
  { name: "Extraccion automatica de copy", autopost: true, later: false, buffer: false, hootsuite: false },
  { name: "Posts colaborativos (Collabs)", autopost: true, later: false, buffer: false, hootsuite: false },
  { name: "30 dias en 2 minutos", autopost: true, later: false, buffer: false, hootsuite: false },
  { name: "Programacion de contenido", autopost: true, later: true, buffer: true, hootsuite: true },
  { name: "Vista previa del feed", autopost: true, later: true, buffer: true, hootsuite: false },
  { name: "API oficial de Meta", autopost: true, later: true, buffer: true, hootsuite: true },
];

const Cell = ({ value, delay }: { value: boolean; delay: number }) => (
  <motion.td
    className={`p-4 ${value ? "" : ""}`}
    initial={{ opacity: 0, scale: 0.5 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    transition={{ delay, type: "spring", stiffness: 300, damping: 20 }}
  >
    {value ? (
      <CheckCircle className="h-4 w-4 text-brand-400 mx-auto" />
    ) : (
      <X className="h-4 w-4 text-zinc-700 mx-auto" />
    )}
  </motion.td>
);

export function ComparisonTable() {
  return (
    <section className="py-28 px-6">
      <div className="max-w-5xl mx-auto">
        <MotionReveal cinematic>
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-brand-400 uppercase tracking-[0.2em] mb-4">
              Comparativa
            </p>
            <h2 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl tracking-tight">
              AutoPost vs <span className="text-gradient">la competencia</span>
            </h2>
          </div>
        </MotionReveal>

        <MotionReveal delay={0.15}>
          <div className="overflow-x-auto rounded-2xl border border-white/[0.06] card-shine group">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left p-4 font-medium text-zinc-400 min-w-[200px] sticky left-0 bg-surface-card z-10">
                    Funcionalidad
                  </th>
                  <th className="p-4 text-center min-w-[100px] bg-brand-500/[0.06] border-x border-brand-500/10">
                    <span className="font-display font-bold text-brand-400">AutoPost</span>
                  </th>
                  <th className="p-4 text-center min-w-[100px] text-zinc-500 font-medium">Later</th>
                  <th className="p-4 text-center min-w-[100px] text-zinc-500 font-medium">Buffer</th>
                  <th className="p-4 text-center min-w-[100px] text-zinc-500 font-medium">Hootsuite</th>
                </tr>
              </thead>
              <tbody>
                {features.map((f, rowIdx) => (
                  <motion.tr
                    key={f.name}
                    className="border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02] transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: rowIdx * 0.06, duration: 0.5, ease: EASE_CINEMATIC }}
                  >
                    <td className="p-4 text-zinc-300 sticky left-0 bg-surface-card z-10">{f.name}</td>
                    <td className="p-4 bg-brand-500/[0.03] border-x border-brand-500/[0.06]">
                      <motion.div
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: rowIdx * 0.06 + 0.2, type: "spring", stiffness: 300, damping: 15 }}
                      >
                        <CheckCircle className="h-4 w-4 text-brand-400 mx-auto" />
                      </motion.div>
                    </td>
                    <Cell value={f.later} delay={rowIdx * 0.06 + 0.25} />
                    <Cell value={f.buffer} delay={rowIdx * 0.06 + 0.3} />
                    <Cell value={f.hootsuite} delay={rowIdx * 0.06 + 0.35} />
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </MotionReveal>

        <MotionReveal delay={0.3}>
          <div className="flex justify-center gap-8 mt-8">
            <motion.div
              className="text-center"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <p className="text-2xl font-display font-bold text-brand-400">$19<span className="text-sm text-zinc-500">/mes</span></p>
              <p className="text-xs text-zinc-500 mt-1">AutoPost Pro</p>
            </motion.div>
            <div className="w-px bg-white/[0.06]" />
            <div className="text-center">
              <p className="text-2xl font-display font-bold text-zinc-500">$25-99<span className="text-sm text-zinc-600">/mes</span></p>
              <p className="text-xs text-zinc-500 mt-1">Competidores</p>
            </div>
          </div>
        </MotionReveal>
      </div>
    </section>
  );
}
