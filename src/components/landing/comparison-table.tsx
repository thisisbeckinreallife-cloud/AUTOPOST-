"use client";

import { CheckCircle, X } from "lucide-react";
import { MotionReveal, MotionStagger, MotionStaggerItem } from "@/components/motion";

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

const Cell = ({ value }: { value: boolean }) =>
  value ? (
    <CheckCircle className="h-4 w-4 text-brand-400 mx-auto" />
  ) : (
    <X className="h-4 w-4 text-zinc-600 mx-auto" />
  );

export function ComparisonTable() {
  return (
    <section className="py-28 px-6">
      <div className="max-w-5xl mx-auto">
        <MotionReveal>
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-brand-400 uppercase tracking-[0.2em] mb-4">
              Comparativa
            </p>
            <h2 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl tracking-tight">
              AutoPost vs <span className="text-gradient">la competencia</span>
            </h2>
          </div>
        </MotionReveal>

        <MotionReveal>
          <div className="overflow-x-auto rounded-2xl border border-white/[0.06]">
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
                {features.map((f) => (
                  <tr key={f.name} className="border-b border-white/[0.03] last:border-0">
                    <td className="p-4 text-zinc-300 sticky left-0 bg-surface-card z-10">{f.name}</td>
                    <td className="p-4 bg-brand-500/[0.03] border-x border-brand-500/[0.06]">
                      <Cell value={f.autopost} />
                    </td>
                    <td className="p-4"><Cell value={f.later} /></td>
                    <td className="p-4"><Cell value={f.buffer} /></td>
                    <td className="p-4"><Cell value={f.hootsuite} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </MotionReveal>

        <MotionReveal delay={0.3}>
          <div className="flex justify-center gap-8 mt-8">
            <div className="text-center">
              <p className="text-2xl font-display font-bold text-brand-400">$19<span className="text-sm text-zinc-500">/mes</span></p>
              <p className="text-xs text-zinc-500 mt-1">AutoPost Pro</p>
            </div>
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
