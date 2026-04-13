import Link from "next/link";
import { ArrowLeft, Zap } from "lucide-react";

export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface-primary flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/3 w-[400px] h-[400px] bg-gradient-radial from-brand-500/5 to-transparent rounded-full" />

      <div className="text-center relative animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/15 flex items-center justify-center mx-auto mb-6">
          <Zap className="h-8 w-8 text-brand-400" />
        </div>

        <p className="text-[120px] font-black text-zinc-800/50 leading-none select-none">404</p>
        <h1 className="mt-2 font-display text-2xl font-bold text-white">Pagina no encontrada</h1>
        <p className="mt-3 text-zinc-500 text-sm max-w-xs mx-auto">
          La pagina que buscas no existe o ha sido movida.
        </p>
        <div className="mt-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Ir al Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
