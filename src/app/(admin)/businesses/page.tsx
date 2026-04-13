import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import Link from "next/link";
import { Plus, Instagram, CheckCircle, AlertCircle, ChevronRight } from "lucide-react";

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
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white tracking-tight">Mis cuentas</h1>
          <p className="text-zinc-500 mt-1 text-sm">Las cuentas de Instagram que gestionas</p>
        </div>
        <Link
          href="/businesses/new"
          className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-400 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all"
        >
          <Plus className="h-4 w-4" />
          Anadir cuenta
        </Link>
      </div>

      {businesses.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-zinc-800 bg-surface-card/50 rounded-2xl">
          <div className="w-14 h-14 rounded-xl bg-brand-500/8 border border-brand-500/10 flex items-center justify-center mx-auto mb-4">
            <Instagram className="h-7 w-7 text-brand-400" />
          </div>
          <h3 className="font-display text-lg font-bold text-white mb-1.5">Tu lista de cuentas esta vacia</h3>
          <p className="text-zinc-500 text-sm mb-6 max-w-xs mx-auto">Conecta tu primera cuenta de Instagram y empieza a programar publicaciones</p>
          <Link
            href="/businesses/new"
            className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-400 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
          >
            <Plus className="h-4 w-4" />
            Anadir cuenta
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {businesses.map((biz, i) => {
            const connected = biz.metaConnection?.status === "ACTIVE";
            return (
              <Link key={biz.id} href={`/businesses/${biz.slug}`}>
                <div className={`group flex items-center gap-4 bg-surface-card border border-white/[0.06] rounded-xl px-5 py-4 hover:border-white/[0.1] transition-all`}>
                  {/* Avatar */}
                  <div className="h-10 w-10 rounded-lg bg-brand-500/10 border border-brand-500/10 flex items-center justify-center shrink-0">
                    <span className="text-brand-400 font-display font-bold text-base uppercase">{biz.name[0]}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-zinc-200 group-hover:text-white transition-colors">{biz.name}</p>
                    {biz.metaConnection?.igUsername ? (
                      <p className="text-sm text-zinc-500 flex items-center gap-1.5 mt-0.5">
                        <Instagram className="h-3 w-3" />
                        @{biz.metaConnection.igUsername}
                      </p>
                    ) : (
                      <p className="text-sm text-amber-400/80 mt-0.5 flex items-center gap-1.5">
                        <AlertCircle className="h-3 w-3" />
                        Sin conectar
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-center hidden sm:block">
                      <p className="text-lg font-display font-bold text-zinc-200 tabular-nums">{biz._count.postDrafts}</p>
                      <p className="text-[10px] text-zinc-600 uppercase tracking-wider">posts</p>
                    </div>
                    {connected ? (
                      <div className="h-7 w-7 rounded-full bg-green-500/10 flex items-center justify-center">
                        <CheckCircle className="h-3.5 w-3.5 text-green-400" />
                      </div>
                    ) : (
                      <div className="h-7 w-7 rounded-full bg-amber-500/10 flex items-center justify-center">
                        <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
                      </div>
                    )}
                    <ChevronRight className="h-4 w-4 text-zinc-700 group-hover:text-zinc-400 group-hover:translate-x-0.5 transition-all" />
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
