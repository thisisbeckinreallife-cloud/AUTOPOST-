import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import Link from "next/link";
import { Plus, Instagram, CheckCircle, AlertCircle, ChevronRight, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BusinessesPage() {
  await requireSession();

  const businesses = await db.business.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      metaConnection: { select: { igUsername: true, status: true } },
      _count: { select: { postDrafts: true } },
    },
  });

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="flex items-center justify-between animate-stagger-in delay-0">
        <div>
          <h1 className="text-2xl font-black text-slate-100">Mis cuentas</h1>
          <p className="text-slate-500 mt-1 text-sm">Las cuentas de Instagram que gestionas</p>
        </div>
        <Link
          href="/businesses/new"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-500 to-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:shadow-glow-lg hover:scale-105 transition-all duration-300"
        >
          <Plus className="h-4 w-4" />
          Anadir cuenta
        </Link>
      </div>

      {businesses.length === 0 ? (
        <div className="relative text-center py-24 border border-dashed border-slate-700 bg-surface-card/50 rounded-2xl animate-card-appear overflow-hidden bg-dots">
          <div className="absolute inset-0 bg-gradient-to-t from-surface-primary/80 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto mb-5 animate-float">
              <Instagram className="h-10 w-10 text-brand-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-100 mb-2">Tu lista de cuentas esta vacia</h3>
            <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">Conecta tu primera cuenta de Instagram y empieza a programar publicaciones</p>
            <Link
              href="/businesses/new"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-500 to-brand-600 text-white px-6 py-3 rounded-xl text-sm font-bold hover:shadow-glow-lg hover:scale-105 transition-all duration-300"
            >
              <Sparkles className="h-4 w-4" />
              Anadir cuenta
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {businesses.map((biz, i) => {
            const connected = biz.metaConnection?.status === "ACTIVE";
            return (
              <Link key={biz.id} href={`/businesses/${biz.slug}`}>
                <div className={`group relative flex items-center gap-4 bg-surface-card border border-slate-800/80 rounded-2xl px-6 py-5 card-hover animate-stagger-in delay-${Math.min(i + 1, 8)} overflow-hidden`}>
                  {/* Subtle gradient on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-500/0 via-brand-500/3 to-brand-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />

                  {/* Avatar */}
                  <div className="relative h-12 w-12 rounded-xl bg-gradient-to-br from-brand-500/15 to-brand-600/15 border border-brand-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-brand-400 font-black text-lg uppercase">{biz.name[0]}</span>
                  </div>

                  <div className="relative flex-1 min-w-0">
                    <p className="font-bold text-slate-100 group-hover:text-white transition-colors">{biz.name}</p>
                    {biz.metaConnection?.igUsername ? (
                      <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <Instagram className="h-3 w-3" />
                        @{biz.metaConnection.igUsername}
                      </p>
                    ) : (
                      <p className="text-sm text-amber-400 mt-0.5 flex items-center gap-1.5">
                        <AlertCircle className="h-3 w-3" />
                        Sin conectar — toca para conectar
                      </p>
                    )}
                  </div>

                  <div className="relative flex items-center gap-4 shrink-0">
                    <div className="text-center hidden sm:block">
                      <p className="text-xl font-black text-slate-100">{biz._count.postDrafts}</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">posts</p>
                    </div>
                    {connected ? (
                      <div className="h-8 w-8 rounded-full bg-green-500/15 flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                      </div>
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-amber-500/15 flex items-center justify-center">
                        <AlertCircle className="h-4 w-4 text-amber-400" />
                      </div>
                    )}
                    <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-brand-400 group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
