import Link from "next/link";

export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface-primary flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-slate-700">404</h1>
        <p className="mt-4 text-slate-500">Pagina no encontrada</p>
        <Link href="/dashboard" className="mt-6 inline-block text-sm text-brand-400 hover:underline">
          Ir al Dashboard
        </Link>
      </div>
    </div>
  );
}
