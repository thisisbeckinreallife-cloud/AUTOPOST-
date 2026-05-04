"use client";

import * as React from "react";
import { cn } from "@/components/brand/cn";

interface FaqItem {
  q: string;
  a: string;
}

const ITEMS: FaqItem[] = [
  {
    q: "¿Mis publicaciones se hacen desde mi cuenta real?",
    a: "Sí. Autopost se conecta vía OAuth oficial a cada red. Las publicaciones aparecen como si las hubieras hecho tú desde la app.",
  },
  {
    q: "¿Puedo aprobar antes de que se publique?",
    a: "Por defecto sí. Cada post se queda en estado 'Borrador IA' hasta que tú apruebas. También puedes activar autoaprobado para flujos confiables.",
  },
  {
    q: "¿Qué redes están soportadas?",
    a: "Instagram, TikTok, X, LinkedIn, YouTube Shorts, Threads y Facebook. Más cada trimestre.",
  },
  {
    q: "¿Mis datos se usan para entrenar modelos?",
    a: "No. Los archivos que subes se procesan en sesión y no entran en ningún corpus de entrenamiento.",
  },
  {
    q: "¿Cuánto tarda en procesar una carpeta?",
    a: "Una carpeta de 30-50 archivos tarda 8-12 segundos. Lo verás en vivo con el contador.",
  },
];

export function Faq() {
  const [open, setOpen] = React.useState<number | null>(0);

  return (
    <section id="faq" className="py-24 px-6 max-w-[800px] mx-auto">
      <header className="text-center mb-12">
        <div className="inline-block font-np-mono text-np-caption text-pri uppercase tracking-widest mb-3">
          PREGUNTAS FRECUENTES
        </div>
        <h2 className="font-np-sans text-np-display font-semibold text-ink-9 leading-tight tracking-tight">
          Lo que la gente nos pregunta
        </h2>
      </header>

      <div className="flex flex-col">
        {ITEMS.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={i} className="border-b border-ink-3">
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : i)}
                className={cn(
                  "w-full flex items-center justify-between gap-4 py-6 text-left",
                  "font-np-sans text-np-h4 font-medium text-ink-9 hover:text-pri",
                  "transition-colors"
                )}
              >
                <span>{item.q}</span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center font-np-mono text-ink-7 flex-shrink-0",
                    "border border-ink-3 transition-all",
                    isOpen && "bg-pri border-pri text-ink-10 rotate-45"
                  )}
                >
                  +
                </span>
              </button>
              <div
                className={cn(
                  "overflow-hidden transition-[max-height] duration-400 ease-out",
                  isOpen ? "max-h-[500px]" : "max-h-0"
                )}
              >
                <p className="pb-6 pr-12 text-np-body-lg text-ink-7 leading-normal">
                  {item.a}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
