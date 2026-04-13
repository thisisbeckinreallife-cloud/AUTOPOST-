import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Instagram, Upload, CheckCircle, AlertCircle, Clock, ChevronRight, BarChart3, Shield } from "lucide-react";
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

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-xl bg-brand-500/10 border border-brand-500/10 flex items-center justify-center shrink-0">
          <span className="text-brand-400 font-display font-bold text-xl uppercase">{business.name[0]}</span>
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-white tracking-tight">{business.name}</h1>
          {business.metaConnection?.igUsername && (
            <p className="text-zinc-500 text-sm flex items-center gap-1.5 mt-0.5">
              <Instagram className="h-3.5 w-3.5" />
              @{business.metaConnection.igUsername}
            </p>
          )}
        </div>
      </div>

      {/* Alerts */}
      {searchParams.connected === "1" && (
        <div className="rounded-xl bg-green-500/8 border border-green-500/15 px-4 py-3 text-sm text-green-400 flex items-center gap-2 animate-fade-in">
          <CheckCircle className="h-4 w-4" />
          Tu cuenta de Instagram se ha conectado correctamente!
        </div>
      )}
      {searchParams.error && (
        <div className="rounded-xl bg-red-500/8 border border-red-500/15 px-4 py-3 text-sm text-red-400 animate-fade-in">
          {decodeURIComponent(searchParams.error)}
        </div>
      )}

      {/* Connection status */}
      <div className={`rounded-xl border bg-surface-card p-5 ${connected ? "border-green-500/10" : "border-amber-500/15"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {connected ? (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/8 border border-green-500/10">
                <Shield className="h-5 w-5 text-green-400" />
              </div>
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/8 border border-amber-500/10">
                <AlertCircle className="h-5 w-5 text-amber-400" />
              </div>
            )}
            <div>
              <p className="font-semibold text-zinc-200">
                {connected ? "Instagram conectado" : "Instagram no conectado"}
              </p>
              <p className="text-sm text-zinc-500">
                {connected
                  ? `@${business.metaConnection?.igUsername} · ${business.metaConnection?.fbPageName ?? ""}`
                  : "Conecta tu cuenta para publicar automaticamente"}
              </p>
              {business.metaConnection?.lastError && (
                <p className="text-xs text-red-400 mt-1">{business.metaConnection.lastError}</p>
              )}
            </div>
          </div>
          <Link
            href={`/businesses/${params.slug}/connect`}
            className={`text-sm font-semibold px-4 py-2 rounded-lg transition-all ${
              connected
                ? "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
                : "bg-brand-500 hover:bg-brand-400 text-white"
            }`}
          >
            {connected ? "Reconectar" : "Conectar"}
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link href={`/businesses/${params.slug}/posts?status=SCHEDULED`}>
          <div className="group rounded-xl border border-white/[0.06] bg-surface-card p-4 hover:border-white/[0.1] transition-all">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/8 mb-3">
              <Clock className="h-4 w-4 text-blue-400" />
            </div>
            <p className="text-2xl font-display font-bold text-white tabular-nums">{upcomingCount}</p>
            <p className="text-xs text-zinc-500 mt-0.5 font-medium uppercase tracking-wider">Programados</p>
          </div>
        </Link>
        <Link href={`/businesses/${params.slug}/posts?status=PUBLISHED`}>
          <div className="group rounded-xl border border-white/[0.06] bg-surface-card p-4 hover:border-white/[0.1] transition-all">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/8 mb-3">
              <CheckCircle className="h-4 w-4 text-green-400" />
            </div>
            <p className="text-2xl font-display font-bold text-white tabular-nums">{publishedCount}</p>
            <p className="text-xs text-zinc-500 mt-0.5 font-medium uppercase tracking-wider">Publicados</p>
          </div>
        </Link>
        <Link href={`/businesses/${params.slug}/posts?status=FAILED`}>
          <div className={`group rounded-xl border bg-surface-card p-4 hover:border-white/[0.1] transition-all ${
            failedCount > 0 ? "border-red-500/10" : "border-white/[0.06]"
          }`}>
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg mb-3 ${
              failedCount > 0 ? "bg-red-500/8" : "bg-zinc-800"
            }`}>
              <AlertCircle className={`h-4 w-4 ${failedCount > 0 ? "text-red-400" : "text-zinc-600"}`} />
            </div>
            <p className="text-2xl font-display font-bold text-white tabular-nums">{failedCount}</p>
            <p className="text-xs text-zinc-500 mt-0.5 font-medium uppercase tracking-wider">Con errores</p>
          </div>
        </Link>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          href={`/businesses/${params.slug}/upload`}
          className="group flex items-center gap-4 bg-brand-500 hover:bg-brand-400 text-white rounded-xl px-5 py-4 transition-all"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
            <Upload className="h-4 w-4" />
          </div>
          <div>
            <p className="font-semibold text-sm">Subir contenido</p>
            <p className="text-xs text-brand-100/70">Sube el ZIP del mes</p>
          </div>
        </Link>
        <Link
          href={`/businesses/${params.slug}/posts`}
          className="group flex items-center gap-4 bg-surface-card border border-white/[0.06] rounded-xl px-5 py-4 hover:border-white/[0.1] transition-all"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800 group-hover:bg-zinc-700 transition-colors">
            <BarChart3 className="h-4 w-4 text-zinc-400" />
          </div>
          <div>
            <p className="font-semibold text-sm text-zinc-200 group-hover:text-white transition-colors">Ver publicaciones</p>
            <p className="text-xs text-zinc-500">Gestiona tus posts</p>
          </div>
        </Link>
      </div>

      {/* Recent uploads */}
      {business.uploadBatches.length > 0 && (
        <div className="">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Subidas recientes</h2>
            <Link href={`/businesses/${params.slug}/batches`} className="text-xs text-brand-400 hover:text-brand-300 font-medium transition-colors">
              Ver todo →
            </Link>
          </div>
          <div className="space-y-1.5">
            {business.uploadBatches.map((batch) => (
              <Link
                key={batch.id}
                href={`/businesses/${params.slug}/batches/${batch.id}`}
                className="group flex items-center gap-3 bg-surface-card border border-white/[0.04] rounded-lg px-4 py-3 hover:border-white/[0.08] transition-all"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-200 truncate group-hover:text-white transition-colors">{batch.originalFilename}</p>
                  <p className="text-xs text-zinc-600">{formatDate(batch.createdAt)} · {batch.validPosts ?? 0} posts</p>
                </div>
                <BatchStatusPill status={batch.status} />
                <ChevronRight className="h-4 w-4 text-zinc-700 group-hover:text-zinc-400 transition-all" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Danger zone */}
      <div className="pt-4 border-t border-white/[0.04]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-zinc-500">Zona peligrosa</p>
            <p className="text-xs text-zinc-700 mt-0.5">Eliminar esta cuenta y todos sus datos</p>
          </div>
          <DeleteBusinessButton slug={params.slug} name={business.name} />
        </div>
      </div>
    </div>
  );
}

function BatchStatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    PARSED:            { label: "Listo", cls: "bg-green-500/10 text-green-400 border-green-500/15" },
    VALIDATION_FAILED: { label: "Con errores", cls: "bg-red-500/10 text-red-400 border-red-500/15" },
    PARSING:           { label: "Procesando...", cls: "bg-blue-500/10 text-blue-400 border-blue-500/15" },
    CONFIRMED:         { label: "Programado", cls: "bg-green-500/10 text-green-400 border-green-500/15" },
  };
  const s = map[status] ?? { label: status, cls: "bg-zinc-500/10 text-zinc-400 border-zinc-500/15" };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${s.cls}`}>{s.label}</span>;
}
