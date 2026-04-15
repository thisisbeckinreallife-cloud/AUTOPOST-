"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    q: "¿Mis credenciales de Instagram están seguras?",
    a: "Sí. AutoPost usa OAuth oficial de Meta. Nunca almacenamos tu contraseña — solo un token de acceso cifrado que puedes revocar en cualquier momento desde tu configuración de Instagram.",
  },
  {
    q: "¿Qué formatos de archivo acepta AutoPost?",
    a: "Imágenes: JPG, PNG, WEBP. Videos: MP4, MOV (hasta 100 MB por archivo). El copy de cada post puede estar en un archivo .txt con el mismo nombre que la imagen o carpeta. Puedes subir todo en un ZIP o seleccionar la carpeta directamente.",
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
    <div className="space-y-2">
      {faqs.map((faq, i) => (
        <div
          key={i}
          className="rounded-xl border border-white/[0.06] bg-surface-card overflow-hidden"
        >
          <button
            className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-white/[0.02] transition-colors"
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            aria-expanded={openIndex === i}
          >
            <span className="text-sm font-semibold text-zinc-200 pr-4">{faq.q}</span>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-zinc-500 shrink-0 transition-transform duration-300",
                openIndex === i && "rotate-180"
              )}
            />
          </button>
          <div className={cn("faq-answer", openIndex === i && "open")}>
            <p className="px-6 pb-5 text-sm text-zinc-400 leading-relaxed">{faq.a}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
