"use client";

import { useState } from "react";
import { BookOpen, ChevronDown, ChevronUp, FolderOpen, Image, FileText, Zap, Lightbulb } from "lucide-react";

interface TutorialPanelProps {
  currentStep: "drop" | "analyzing" | "review" | "schedule" | "calendar" | "uploading";
}

const TIPS: Record<string, { icon: React.ReactNode; title: string; content: string }[]> = {
  drop: [
    {
      icon: <FolderOpen className="h-4 w-4 text-zinc-700" />,
      title: "Como preparar tu contenido",
      content:
        "Sube un video o foto directamente, o usa una carpeta/ZIP con varios posts. No importa como lo organices.",
    },
    {
      icon: <Image className="h-4 w-4 text-emerald-700" />,
      title: "Formatos aceptados",
      content:
        "Fotos: JPG, PNG, WEBP. Videos: MP4, MOV. Cada foto sera un post. Para carruseles, pon varias fotos en una subcarpeta.",
    },
    {
      icon: <FileText className="h-4 w-4 text-blue-700" />,
      title: "Agrega texto a tus posts",
      content:
        "Pon un archivo caption.txt junto a cada foto o en cada subcarpeta. Si no lo agregas ahora, podras hacerlo en el siguiente paso.",
    },
  ],
  review: [
    {
      icon: <Zap className="h-4 w-4 text-amber-700" />,
      title: "Posts incompletos",
      content:
        'Los posts en amarillo no tienen texto. Haz clic en el post y usa "Agregar texto" para completarlos.',
    },
    {
      icon: <Image className="h-4 w-4 text-emerald-700" />,
      title: "Revisa las fotos",
      content:
        "Abre cada post para verificar que las fotos y el orden son correctos antes de continuar.",
    },
    {
      icon: <Lightbulb className="h-4 w-4 text-zinc-700" />,
      title: "Carruseles",
      content:
        "Si detectamos varias fotos en una carpeta, las agrupamos como carrusel. Puedes cambiar esto a posts individuales.",
    },
  ],
  schedule: [
    {
      icon: <Zap className="h-4 w-4 text-zinc-700" />,
      title: "Mejor hora para publicar",
      content:
        "Las mejores horas son entre las 9-11 AM o 6-8 PM de tu zona horaria. Experimenta con tu audiencia.",
    },
    {
      icon: <FolderOpen className="h-4 w-4 text-blue-700" />,
      title: "Consistencia es clave",
      content:
        "Publicar de forma regular ayuda a crecer tu audiencia. Te recomendamos al menos 3 veces por semana.",
    },
  ],
  calendar: [
    {
      icon: <Zap className="h-4 w-4 text-zinc-700" />,
      title: "Vista previa",
      content:
        "Este calendario muestra como quedaran distribuidos tus posts. Verifica las fechas antes de confirmar.",
    },
  ],
  analyzing: [],
  uploading: [],
};

export function TutorialPanel({ currentStep }: TutorialPanelProps) {
  const [expanded, setExpanded] = useState(true);
  const tips = TIPS[currentStep] ?? [];

  if (tips.length === 0) return null;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 transition-colors"
      >
        <span className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-zinc-600" />
          Guia rapida
        </span>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-zinc-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-zinc-500" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-zinc-100 pt-3">
          {tips.map((tip, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">{tip.icon}</div>
              <div>
                <p className="text-sm font-semibold text-zinc-900">{tip.title}</p>
                <p className="text-xs text-zinc-600 mt-0.5 leading-relaxed">
                  {tip.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
