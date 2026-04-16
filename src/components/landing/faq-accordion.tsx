"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { EASE_CINEMATIC } from "@/components/motion";

const faqs = [
  {
    q: "¿Mis credenciales de Instagram estan seguras?",
    a: "Si. AutoPost usa OAuth oficial de Meta. Nunca almacenamos tu contrasena — solo un token de acceso cifrado que puedes revocar en cualquier momento desde tu configuracion de Instagram.",
  },
  {
    q: "¿Que formatos de archivo acepta AutoPost?",
    a: "Imagenes: JPG, PNG, WEBP. Videos: MP4, MOV (hasta 100 MB por archivo). El copy de cada post puede estar en un archivo .txt con el mismo nombre que la imagen o carpeta. Puedes subir todo en un ZIP o seleccionar la carpeta directamente.",
  },
  {
    q: "¿Funciona con cuentas de empresa y creador?",
    a: "Si. AutoPost es compatible con Cuentas de Empresa y Cuentas de Creador de Instagram. Necesitas que tu cuenta este vinculada a una Pagina de Facebook, que es un requisito de la API oficial de Meta.",
  },
  {
    q: "¿Que son los posts colaborativos?",
    a: "Los posts colaborativos (Collabs) de Instagram permiten que un post aparezca en el feed de dos o mas cuentas a la vez, multiplicando el alcance. AutoPost te permite anadir hasta 3 colaboradores por post desde el panel de revision, antes de programar.",
  },
  {
    q: "¿Puedo cancelar cuando quiera?",
    a: "Si, sin penalizaciones ni permanencia. Puedes cancelar tu suscripcion desde Ajustes en cualquier momento. Tus posts ya programados se mantendran activos hasta el final del periodo facturado.",
  },
];

export function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {faqs.map((faq, i) => {
        const isOpen = openIndex === i;
        return (
          <motion.div
            key={i}
            className={cn(
              "rounded-xl border bg-white shadow-sm overflow-hidden transition-colors duration-300",
              isOpen ? "border-brand-500/20" : "border-zinc-100"
            )}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.5, ease: EASE_CINEMATIC }}
            layout
          >
            <button
              className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-zinc-50 transition-colors group"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              aria-expanded={isOpen}
            >
              <span className={cn(
                "text-sm font-semibold pr-4 transition-colors duration-300",
                isOpen ? "text-zinc-900" : "text-zinc-700"
              )}>
                {faq.q}
              </span>
              <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.35, ease: EASE_CINEMATIC }}
              >
                <ChevronDown className={cn(
                  "h-4 w-4 shrink-0 transition-colors duration-300",
                  isOpen ? "text-brand-400" : "text-zinc-500"
                )} />
              </motion.div>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.4, ease: EASE_CINEMATIC }}
                  className="overflow-hidden"
                >
                  <p className="px-6 pb-5 text-sm text-zinc-500 leading-relaxed">{faq.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
