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
          <h1 className="text-2xl font-bold text-slate-100">Mis cuentas</h1>
          <p className="text-slate-500 mt-1 text-sm">Las cuentas de Instagram que gestionas</p>
        </div>
        <Link
          href="/businesses/new"
          className="inline-flex items-center gap-2 bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-400 hover:shadow-glow transition-all"
        >
          <Plus className="h-4 w-4" />
          Anadir cuenta
        </Link>
      </div>

      {businesses.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-800 bg-surface-card/50 rounded-xl">
          <Instagram className="h-10 w-10 text-slate-600 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-300 mb-1">Aun no tienes cuentas</h3>
          <p className="text-slate-500 text-sm mb-4">Anade tu primera cuenta de Instagram para empezar</p>
          <Link
            href="/businesses/new"
            className="inline-flex items-center gap-2 bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-400 hover:shadow-glow transition-all"
          >
            <Plus className="h-4 w-4" />
            Anadir cuenta
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {businesses.map((biz) => {
            const connected = biz.metaConnection?.status === "ACTIVE";
            return (
              <Link key={biz.id} href={`/businesses/${biz.slug}`}>
                <div className="flex items-center gap-4 bg-surface-card border border-slate-800 rounded-xl px-5 py-4 hover:border-slate-700 hover:bg-surface-hover transition-all cursor-pointer">
                  <div className="h-11 w-11 rounded-full bg-brand-500/10 flex items-center justify-center shrink-0">
                    <span className="text-brand-400 font-bold text-lg uppercase">{biz.name[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-100">{biz.name}</p>
                    {biz.metaConnection?.igUsername ? (
                      <p className="text-sm text-slate-500">@{biz.metaConnection.igUsername}</p>
                    ) : (
                      <p className="text-sm text-amber-400">Sin conectar — toca para conectar</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-center hidden sm:block">
                      <p className="text-lg font-bold text-slate-100">{biz._count.postDrafts}</p>
                      <p className="text-xs text-slate-500">posts</p>
                    </div>
                    {connected ? (
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-amber-400" />
                    )}
                    <ChevronRight className="h-4 w-4 text-slate-600" />
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
