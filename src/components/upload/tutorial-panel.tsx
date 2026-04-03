"use client";

import { useState } from "react";
import { BookOpen, ChevronDown, ChevronUp, FolderOpen, Image, FileText, Zap } from "lucide-react";

interface TutorialPanelProps {
  /** Which step the user is on, for contextual tips */
  currentStep: "drop" | "analyzing" | "review" | "schedule" | "calendar" | "uploading";
}

const TIPS: Record<string, { icon: React.ReactNode; title: string; content: string }[]> = {
  drop: [
    {
      icon: <FolderOpen className="h-4 w-4 text-brand-400" />,
      title: "Como preparar tu contenido",
      content:
        "Mete todas tus fotos y videos en una carpeta y comprimela como ZIP. No importa como la organices, nosotros la entendemos.",
    },
    {
      icon: <Image className="h-4 w-4 text-green-500" />,
      title: "Formatos aceptados",
      content:
        "Fotos: JPG, PNG, WEBP. Videos: MP4, MOV. Cada foto sera un post. Si quieres un carrusel, pon varias fotos en una carpeta.",
    },
    {
      icon: <FileText className="h-4 w-4 text-blue-500" />,
      title: "Agrega texto a tus posts",
      content:
        "Si quieres que tu post tenga texto, pon un archivo caption.txt junto a la foto. Si no, puedes agregarlo despues.",
    },
  ],
  review: [
    {
      icon: <Zap className="h-4 w-4 text-amber-500" />,
      title: "Posts incompletos",
      content:
        "Los posts marcados en amarillo no tienen texto. Puedes agregarlo ahora haciendo clic en 'Agregar texto'.",
    },
    {
      icon: <Image className="h-4 w-4 text-green-500" />,
      title: "Revisa las fotos",
      content:
        "Haz clic en cada post para ver las fotos y verificar que todo este correcto antes de continuar.",
    },
  ],
  schedule: [
    {
      icon: <Zap className="h-4 w-4 text-brand-400" />,
      title: "Mejor hora para publicar",
      content:
        "En general, las mejores horas son entre las 9 AM y 11 AM o entre las 6 PM y 8 PM de tu zona horaria.",
    },
    {
      icon: <FolderOpen className="h-4 w-4 text-blue-500" />,
      title: "Consistencia es clave",
      content:
        "Publicar de forma regular ayuda a crecer tu audiencia. Te recomendamos al menos 3 veces por semana.",
    },
  ],
  calendar: [
    {
      icon: <Zap className="h-4 w-4 text-indigo-500" />,
      title: "Vista previa",
      content:
        "Este calendario muestra como quedaran distribuidos tus posts. Verifica que las fechas sean correctas.",
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
    <div className="bg-surface-primary border border-slate-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-200 hover:bg-slate-800 transition-colors"
      >
        <span className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-slate-400" />
          Tutorial rapido
        </span>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-800 pt-3">
          {tips.map((tip, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">{tip.icon}</div>
              <div>
                <p className="text-sm font-medium text-slate-200">{tip.title}</p>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
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
