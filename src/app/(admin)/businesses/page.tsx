import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import Link from "next/link";
import {
  Plus, Instagram, CheckCircle, AlertCircle, ChevronRight,
  Upload, FileText, Calendar, XCircle,
} from "lucide-react";
import { startOfMonth } from "date-fns";

export const dynamic = "force-dynamic";

export default async function BusinessesPage() {
  await requireSession();

  const monthStart = startOfMonth(new Date());

  const businesses = await db.business.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      metaConnection: { select: { igUsername: true, status: true } },
      postDrafts: {
        select: { status: true, publishAt: true },
      },
    },
  });

  const enriched = businesses.map((biz) => {
    const published = biz.postDrafts.filter((p) => p.status === "PUBLISHED").length;
    const publishedThisMonth = biz.postDrafts.filter(
      (p) => p.status === "PUBLISHED" && p.publishAt >= monthStart
    ).length;
    const failed = biz.postDrafts.filter((p) => p.status === "FAILED").length;
    const scheduled = biz.postDrafts.filter((p) => p.status === "SCHEDULED").length;
    const total = biz.postDrafts.length;
    const connectionStatus = biz.metaConnection?.status ?? null;
    const igUsername = biz.metaConnection?.igUsername ?? null;

    return {
      ...biz,
      published,
      publishedThisMonth,
      failed,
      scheduled,
      total,
      connectionStatus,
      igUsername,
    };
  });

  function connectionBadge(status: string | null) {
    if (status === "ACTIVE") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 font-medium border border-green-500/10">
          <CheckCircle className="h-2.5 w-2.5" />
          Conectado
        </span>
      );
    }
    if (status === "TOKEN_EXPIRED" || status === "ERROR") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 font-medium border border-red-500/10">
          <XCircle className="h-2.5 w-2.5" />
          Token expirado
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-medium border border-amber-500/10">
        <AlertCircle className="h-2.5 w-2.5" />
        Sin conectar
      </span>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between animate-fade-up">
        <div>
          <h1 className="font-display text-2xl font-bold text-white tracking-tight">Mis cuentas</h1>
          <p className="text-zinc-500 mt-1 text-sm">
            {businesses.length} cuenta{businesses.length !== 1 ? "s" : ""} gestionadas
          </p>
        </div>
        <Link
          href="/businesses/new"
          className="inline-flex items-center gap-2 bg-gradient-brand-vivid hover:shadow-glow text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all hover:-translate-y-px"
        >
          <Plus className="h-4 w-4" />
          Añadir cuenta
        </Link>
      </div>

      {enriched.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-white/[0.06] bg-surface-card/50 rounded-2xl animate-fade-up stagger-1">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-500/12 to-accent-violet/8 border border-brand-500/10 flex items-center justify-center mx-auto mb-4">
            <Instagram className="h-7 w-7 text-brand-400" />
          </div>
          <h3 className="font-display text-lg font-bold text-white mb-1.5">Tu lista de cuentas está vacía</h3>
          <p className="text-zinc-500 text-sm mb-6 max-w-xs mx-auto">
            Conecta tu primera cuenta de Instagram y empieza a programar publicaciones
          </p>
          <Link
            href="/businesses/new"
            className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-400 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
          >
            <Plus className="h-4 w-4" />
            Añadir cuenta
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {enriched.map((biz, i) => {
            const needsConnect = !biz.connectionStatus || biz.connectionStatus !== "ACTIVE";
            return (
              <div
                key={biz.id}
                className="rounded-xl border border-white/[0.06] bg-surface-card overflow-hidden hover:border-brand-500/15 transition-all card-interactive animate-fade-up"
                style={{ animationDelay: `${i * 0.07}s` }}
              >
                {/* Main row */}
                <Link href={`/businesses/${biz.slug}`} className="flex items-center gap-4 px-5 py-4">
                  {/* Avatar */}
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-brand-500/15 to-accent-violet/10 border border-brand-500/10 flex items-center justify-center shrink-0">
                    <span className="text-brand-400 font-display font-bold text-base uppercase">
                      {biz.name[0]}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-zinc-200">{biz.name}</p>
                      {connectionBadge(biz.connectionStatus)}
                    </div>
                    {biz.igUsername ? (
                      <p className="text-sm text-zinc-500 flex items-center gap-1.5 mt-0.5">
                        <Instagram className="h-3 w-3" />
                        @{biz.igUsername}
                      </p>
                    ) : (
                      <p className="text-sm text-zinc-600 mt-0.5">Sin cuenta Instagram vinculada</p>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="hidden sm:flex items-center gap-5 shrink-0 text-center">
                    <div>
                      <p className="text-base font-display font-bold text-green-400 tabular-nums">{biz.publishedThisMonth}</p>
                      <p className="text-[10px] text-zinc-600 uppercase tracking-wider">este mes</p>
                    </div>
                    <div>
                      <p className="text-base font-display font-bold text-blue-400 tabular-nums">{biz.scheduled}</p>
                      <p className="text-[10px] text-zinc-600 uppercase tracking-wider">prog.</p>
                    </div>
                    {biz.failed > 0 && (
                      <div>
                        <p className="text-base font-display font-bold text-red-400 tabular-nums">{biz.failed}</p>
                        <p className="text-[10px] text-zinc-600 uppercase tracking-wider">errores</p>
                      </div>
                    )}
                  </div>

                  <ChevronRight className="h-4 w-4 text-zinc-700 group-hover:text-zinc-400 shrink-0" />
                </Link>

                {/* Quick actions row */}
                <div className="flex items-center gap-1 px-5 py-2.5 border-t border-white/[0.03] bg-white/[0.01]">
                  {needsConnect ? (
                    <Link
                      href={`/businesses/${biz.slug}/connect`}
                      className="flex items-center gap-1.5 text-xs font-medium text-amber-400 hover:text-amber-300 px-3 py-1.5 rounded-lg hover:bg-amber-500/8 transition-colors"
                    >
                      <Instagram className="h-3.5 w-3.5" />
                      {biz.connectionStatus === "TOKEN_EXPIRED" ? "Reconectar Instagram" : "Conectar Instagram"}
                    </Link>
                  ) : (
                    <Link
                      href={`/businesses/${biz.slug}/upload`}
                      className="flex items-center gap-1.5 text-xs font-medium text-brand-400 hover:text-brand-300 px-3 py-1.5 rounded-lg hover:bg-brand-500/8 transition-colors"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Subir contenido
                    </Link>
                  )}
                  <Link
                    href={`/businesses/${biz.slug}/batches`}
                    className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-300 px-3 py-1.5 rounded-lg hover:bg-white/[0.04] transition-colors"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Subidas
                  </Link>
                  <Link
                    href={`/businesses/${biz.slug}/posts`}
                    className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-300 px-3 py-1.5 rounded-lg hover:bg-white/[0.04] transition-colors"
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    Posts ({biz.total})
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
