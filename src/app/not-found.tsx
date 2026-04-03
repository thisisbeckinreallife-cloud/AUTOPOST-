import Link from "next/link";
import { ArrowLeft, Zap } from "lucide-react";

export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface-primary flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-dots opacity-30" />
      <div className="absolute top-1/4 left-1/3 w-[400px] h-[400px] bg-gradient-radial from-brand-500/5 to-transparent rounded-full" />
      <div className="absolute bottom-1/4 right-1/3 w-[300px] h-[300px] bg-gradient-radial from-red-500/5 to-transparent rounded-full" />

      <div className="text-center relative animate-card-appear">
        {/* Floating icon */}
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500/10 to-brand-600/10 border border-brand-500/15 flex items-center justify-center mx-auto mb-6 animate-float">
          <Zap className="h-10 w-10 text-brand-400" />
        </div>

        <p className="text-[120px] font-black text-slate-800/50 leading-none select-none">404</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-100">Pagina no encontrada</h1>
        <p className="mt-3 text-slate-500 text-sm max-w-xs mx-auto">
          La pagina que buscas no existe o ha sido movida.
        </p>
        <div className="mt-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-500 to-brand-600 text-white px-6 py-3 rounded-xl text-sm font-bold hover:shadow-glow-lg hover:scale-105 transition-all duration-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Ir al Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
