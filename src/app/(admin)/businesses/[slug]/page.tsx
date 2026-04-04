import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Instagram, Upload, CheckCircle, AlertCircle, Clock, ChevronRight, Zap, BarChart3 } from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { DeleteBusinessButton } from "@/components/delete-business-button";

export const dynamic = "force-dynamic";

export default async function BusinessPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { connected?: string; error?: string };
}) {
  await requireSession();

  const business = await db.business.findUnique({
    where: { slug: params.slug },
    include: {
      metaConnection: {
        select: { igUsername: true, fbPageName: true, status: true, tokenExpiresAt: true, lastError: true },
      },
      uploadBatches: {
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, originalFilename: true, status: true, validPosts: true, createdAt: true },
      },
      _count: { select: { postDrafts: true } },
    },
  });

  if (!business) notFound();

  const upcomingCount = await db.postDraft.count({
    where: { businessId: business.id, publishAt: { gte: new Date() }, status: { in: ["SCHEDULED", "READY"] } },
  });

  const publishedCount = await db.postDraft.count({ where: { businessId: business.id, status: "PUBLISHED" } });
  const failedCount = await db.postDraft.count({ where: { businessId: business.id, status: "FAILED" } });

  const connected = business.metaConnection?.status === "ACTIVE";

  return (
    <div className="space-y-6 max-w-2xl">
      <Breadcrumb items={[
        { label: "Inicio", href: "/dashboard" },
        { label: business.name },
      ]} />

      {/* Header with gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500/10 via-surface-card to-surface-card border border-brand-500/10 p-6 animate-card-appear">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-radial from-brand-500/8 to-transparent rounded-full -translate-y-1/3 translate-x-1/4" />
        <div className="relative flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-brand-500/20 to-brand-600/20 border border-brand-500/15 flex items-center justify-center shrink-0 animate-spin-in">
            <span className="text-brand-400 font-black text-2xl uppercase">{business.name[0]}</span>
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-100">{business.name}</h1>
            {business.metaConnection?.igUsername && (
              <p className="text-slate-500 text-sm flex items-center gap-1.5 mt-0.5">
                <Instagram className="h-3.5 w-3.5" />
                @{business.metaConnection.igUsername}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Alerts */}
      {searchParams.connected === "1" && (
        <div className="rounded-xl bg-green-500/10 border border-green-500/20 px-5 py-3.5 text-sm text-green-400 flex items-center gap-2 animate-bounce-in">
          <CheckCircle className="h-4 w-4" />
          Tu cuenta de Instagram se ha conectado correctamente!
        </div>
      )}
      {searchParams.error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-5 py-3.5 text-sm text-red-400 animate-bounce-in">
          {decodeURIComponent(searchParams.error)}
        </div>
      )}

      {/* Connection status */}
      <div className={`group rounded-2xl border bg-surface-card p-5 card-hover animate-stagger-in delay-1 ${connected ? "border-green-500/15" : "border-amber-500/15 animate-border-pulse"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {connected ? (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10 border border-green-500/15">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/15 animate-float">
                <AlertCircle className="h-6 w-6 text-amber-400" />
              </div>
            )}
            <div>
              <p className="font-bold text-slate-200">
                {connected ? "Instagram conectado" : "Instagram no conectado"}
              </p>
              <p className="text-sm text-slate-500">
                {connected
                  ? `@${business.metaConnection?.igUsername} · ${business.metaConnection?.fbPageName ?? ""}`
                  : "Conecta tu cuenta para empezar a publicar automaticamente"}
              </p>
              {business.metaConnection?.lastError && (
                <p className="text-xs text-red-400 mt-1">{business.metaConnection.lastError}</p>
              )}
            </div>
          </div>
          <Link
            href={`/businesses/${params.slug}/connect`}
            className={`text-sm font-bold px-4 py-2 rounded-lg transition-all duration-300 ${
              connected
                ? "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                : "bg-gradient-to-r from-brand-500 to-brand-600 text-white hover:shadow-glow hover:scale-105"
            }`}
          >
            {connected ? "Reconectar" : "Conectar"}
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link href={`/businesses/${params.slug}/posts?status=SCHEDULED`}>
          <div className="group rounded-2xl border border-blue-500/10 bg-gradient-to-br from-blue-500/8 to-transparent p-5 card-hover animate-stagger-in delay-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 mb-3 group-hover:scale-110 transition-transform duration-300">
              <Clock className="h-5 w-5 text-blue-400" />
            </div>
            <p className="text-3xl font-black text-slate-100 stat-number">{upcomingCount}</p>
            <p className="text-xs text-slate-500 mt-1 font-medium uppercase tracking-wider">Programados</p>
          </div>
        </Link>
        <Link href={`/businesses/${params.slug}/posts?status=PUBLISHED`}>
          <div className="group rounded-2xl border border-green-500/10 bg-gradient-to-br from-green-500/8 to-transparent p-5 card-hover animate-stagger-in delay-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10 mb-3 group-hover:scale-110 transition-transform duration-300">
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
            <p className="text-3xl font-black text-slate-100 stat-number">{publishedCount}</p>
            <p className="text-xs text-slate-500 mt-1 font-medium uppercase tracking-wider">Publicados</p>
          </div>
        </Link>
        <Link href={`/businesses/${params.slug}/posts?status=FAILED`}>
          <div className={`group rounded-2xl border bg-gradient-to-br p-5 card-hover animate-stagger-in delay-4 ${
            failedCount > 0
              ? "border-red-500/15 from-red-500/8 to-transparent"
              : "border-slate-800 from-slate-500/5 to-transparent"
          }`}>
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl mb-3 group-hover:scale-110 transition-transform duration-300 ${
              failedCount > 0 ? "bg-red-500/10" : "bg-slate-500/10"
            }`}>
              <AlertCircle className={`h-5 w-5 ${failedCount > 0 ? "text-red-400" : "text-slate-500"}`} />
            </div>
            <p className="text-3xl font-black text-slate-100 stat-number">{failedCount}</p>
            <p className="text-xs text-slate-500 mt-1 font-medium uppercase tracking-wider">Con errores</p>
          </div>
        </Link>
      </div>

      {/* Main actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          href={`/businesses/${params.slug}/upload`}
          className="group relative flex items-center gap-4 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-2xl px-6 py-5 hover:shadow-glow-lg hover:scale-[1.02] transition-all duration-300 overflow-hidden animate-stagger-in delay-5"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
            <Upload className="h-5 w-5" />
          </div>
          <div className="relative">
            <p className="font-bold text-sm">Subir contenido</p>
            <p className="text-xs text-brand-200">Sube el ZIP del mes</p>
          </div>
        </Link>
        <Link
          href={`/businesses/${params.slug}/posts`}
          className="group flex items-center gap-4 bg-surface-card border border-slate-800 rounded-2xl px-6 py-5 card-hover animate-stagger-in delay-6"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 group-hover:bg-brand-500/10 transition-colors duration-300">
            <BarChart3 className="h-5 w-5 text-slate-400 group-hover:text-brand-400 transition-colors duration-300" />
          </div>
          <div>
            <p className="font-bold text-sm text-slate-200 group-hover:text-white transition-colors">Ver publicaciones</p>
            <p className="text-xs text-slate-500">Gestiona tus posts</p>
          </div>
        </Link>
      </div>

      {/* Recent uploads */}
      {business.uploadBatches.length > 0 && (
        <div className="animate-stagger-in delay-7">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Subidas recientes</h2>
            <Link href={`/businesses/${params.slug}/batches`} className="text-xs text-brand-400 hover:text-brand-300 font-medium transition-colors">
              Ver todo →
            </Link>
          </div>
          <div className="space-y-2">
            {business.uploadBatches.map((batch, i) => (
              <Link
                key={batch.id}
                href={`/businesses/${params.slug}/batches/${batch.id}`}
                className={`group flex items-center gap-3 bg-surface-card border border-slate-800/80 rounded-xl px-5 py-3.5 card-hover animate-stagger-in delay-${Math.min(i + 7, 8)}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-200 truncate group-hover:text-white transition-colors">{batch.originalFilename}</p>
                  <p className="text-xs text-slate-500">{formatDate(batch.createdAt)} · {batch.validPosts ?? 0} posts validos</p>
                </div>
                <BatchStatusPill status={batch.status} />
                <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-brand-400 group-hover:translate-x-0.5 transition-all duration-300" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Danger zone */}
      <div className="animate-stagger-in delay-8 pt-4 border-t border-slate-800/50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-400">Zona peligrosa</p>
            <p className="text-xs text-slate-600 mt-0.5">Eliminar esta cuenta y todos sus datos</p>
          </div>
          <DeleteBusinessButton slug={params.slug} name={business.name} />
        </div>
      </div>
    </div>
  );
}

function BatchStatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    PARSED:            { label: "Listo", cls: "bg-green-500/20 text-green-400 border-green-500/20" },
    VALIDATION_FAILED: { label: "Con errores", cls: "bg-red-500/20 text-red-400 border-red-500/20" },
    PARSING:           { label: "Procesando...", cls: "bg-blue-500/20 text-blue-400 border-blue-500/20" },
    CONFIRMED:         { label: "Programado", cls: "bg-green-500/20 text-green-400 border-green-500/20" },
  };
  const s = map[status] ?? { label: status, cls: "bg-slate-500/20 text-slate-400 border-slate-500/20" };
  return <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${s.cls}`}>{s.label}</span>;
}
