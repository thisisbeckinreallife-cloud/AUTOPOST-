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
          <h1 className="text-2xl font-bold text-slate-900">Mis cuentas</h1>
          <p className="text-slate-500 mt-1 text-sm">Las cuentas de Instagram que gestionas</p>
        </div>
        <Link
          href="/businesses/new"
          className="inline-flex items-center gap-2 bg-pink-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-pink-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Añadir cuenta
        </Link>
      </div>

      {businesses.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-xl">
          <Instagram className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-700 mb-1">Aún no tienes cuentas</h3>
          <p className="text-slate-400 text-sm mb-4">Añade tu primera cuenta de Instagram para empezar</p>
          <Link
            href="/businesses/new"
            className="inline-flex items-center gap-2 bg-pink-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-pink-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Añadir cuenta
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {businesses.map((biz) => {
            const connected = biz.metaConnection?.status === "ACTIVE";
            return (
              <Link key={biz.id} href={`/businesses/${biz.slug}`}>
                <div className="flex items-center gap-4 bg-white border border-slate-200 rounded-xl px-5 py-4 hover:border-pink-300 hover:shadow-sm transition-all cursor-pointer">
                  <div className="h-11 w-11 rounded-full bg-pink-100 flex items-center justify-center shrink-0">
                    <span className="text-pink-600 font-bold text-lg uppercase">{biz.name[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900">{biz.name}</p>
                    {biz.metaConnection?.igUsername ? (
                      <p className="text-sm text-slate-400">@{biz.metaConnection.igUsername}</p>
                    ) : (
                      <p className="text-sm text-amber-500">Sin conectar — toca para conectar</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-center hidden sm:block">
                      <p className="text-lg font-bold text-slate-900">{biz._count.postDrafts}</p>
                      <p className="text-xs text-slate-400">posts</p>
                    </div>
                    {connected ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-amber-400" />
                    )}
                    <ChevronRight className="h-4 w-4 text-slate-300" />
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
