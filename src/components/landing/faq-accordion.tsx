"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EASE_CINEMATIC } from "@/components/motion";
import { Icon } from "@/components/editorial/atoms";

const faqs = [
  {
    q: "¿Mis credenciales de Instagram están seguras?",
    a: "Sí. AutoPost usa OAuth oficial de Meta. Nunca almacenamos tu contraseña — solo un token de acceso cifrado que puedes revocar en cualquier momento desde tu configuración de Instagram.",
  },
  {
    q: "¿Qué formatos de archivo acepta AutoPost?",
    a: "Imágenes: JPG, PNG, WEBP. Vídeos: MP4, MOV (hasta 100 MB por archivo). El copy de cada post puede estar en un archivo .txt con el mismo nombre que la imagen o carpeta. Puedes subir todo en un ZIP o seleccionar la carpeta directamente.",
  },
  {
    q: "¿Funciona con cuentas de empresa y creador?",
    a: "Sí. AutoPost es compatible con Cuentas de Empresa y Cuentas de Creador de Instagram. Necesitas que tu cuenta esté vinculada a una Página de Facebook, que es un requisito de la API oficial de Meta.",
  },
  {
    q: "¿Qué son los posts colaborativos?",
    a: "Los posts colaborativos (Collabs) de Instagram permiten que un post aparezca en el feed de dos o más cuentas a la vez, multiplicando el alcance. AutoPost te permite añadir hasta 3 colaboradores por post desde el panel de revisión, antes de programar.",
  },
  {
    q: "¿Puedo cancelar cuando quiera?",
    a: "Sí, sin penalizaciones ni permanencia. Puedes cancelar tu suscripción desde Ajustes en cualquier momento. Tus posts ya programados se mantendrán activos hasta el final del periodo facturado.",
  },
];

export function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div>
      {faqs.map((faq, i) => {
        const isOpen = openIndex === i;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06, duration: 0.5, ease: EASE_CINEMATIC }}
            layout
            style={{
              borderTop: "1px solid var(--ap-line)",
              borderLeft: isOpen
                ? "2px solid var(--ap-stamp)"
                : "2px solid transparent",
              borderBottom:
                i === faqs.length - 1 ? "1px solid var(--ap-line)" : "none",
              transition: "border-left-color 0.3s",
            }}
          >
            <button
              className="w-full flex items-center justify-between text-left transition-opacity hover:opacity-70"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              aria-expanded={isOpen}
              style={{
                padding: "20px 24px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              <span
                className="ap-display"
                style={{
                  fontSize: 17,
                  fontStyle: "italic",
                  color: "var(--ap-ink)",
                  letterSpacing: "-0.01em",
                  paddingRight: 16,
                }}
              >
                {faq.q}
              </span>
              <motion.div
                animate={{ rotate: isOpen ? 45 : 0 }}
                transition={{ duration: 0.3, ease: EASE_CINEMATIC }}
                style={{ flexShrink: 0 }}
              >
                <Icon
                  name="plus"
                  size={16}
                  c={isOpen ? "var(--ap-stamp)" : "var(--ap-ink-3)"}
                  sw={1.5}
                />
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
                  <p
                    style={{
                      padding: "0 24px 22px",
                      fontSize: 15,
                      color: "var(--ap-ink-3)",
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    {faq.a}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
