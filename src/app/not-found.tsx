import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface-primary flex items-center justify-center p-4">
      <div className="text-center animate-fade-in">
        <p className="text-8xl font-bold text-slate-800 select-none animate-pulse-glow inline-block">404</p>
        <h1 className="mt-4 text-xl font-semibold text-slate-200">Pagina no encontrada</h1>
        <p className="mt-2 text-slate-500 text-sm max-w-xs mx-auto">
          La pagina que buscas no existe o ha sido movida.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-brand-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-400 hover:shadow-glow transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Ir al Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
