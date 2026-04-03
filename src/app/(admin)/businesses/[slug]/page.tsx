import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Instagram, Upload, CheckCircle, AlertCircle, Clock, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";

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
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-full bg-brand-500/10 flex items-center justify-center shrink-0">
          <span className="text-brand-400 font-bold text-2xl uppercase">{business.name[0]}</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-100">{business.name}</h1>
          {business.metaConnection?.igUsername && (
            <p className="text-slate-500 text-sm flex items-center gap-1">
              <Instagram className="h-3.5 w-3.5" />
              @{business.metaConnection.igUsername}
            </p>
          )}
        </div>
      </div>

      {/* Alerts */}
      {searchParams.connected === "1" && (
        <div className="rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-3 text-sm text-green-400 flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          Tu cuenta de Instagram se ha conectado correctamente!
        </div>
      )}
      {searchParams.error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {decodeURIComponent(searchParams.error)}
        </div>
      )}

      {/* Connection status */}
      <Card className={`p-5 ${connected ? "border-green-500/20" : "border-amber-500/20"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {connected ? (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                <AlertCircle className="h-5 w-5 text-amber-400" />
              </div>
            )}
            <div>
              <p className="font-semibold text-slate-200">
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
            className="text-sm font-medium text-brand-400 hover:text-brand-300 whitespace-nowrap"
          >
            {connected ? "Reconectar" : "Conectar"}
          </Link>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link href={`/businesses/${params.slug}/posts?status=SCHEDULED`}>
          <Card className="p-4 hover:border-slate-700 transition-colors">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 mb-2">
              <Clock className="h-4 w-4 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-slate-100">{upcomingCount}</p>
            <p className="text-xs text-slate-500 mt-0.5">Programados</p>
          </Card>
        </Link>
        <Link href={`/businesses/${params.slug}/posts?status=PUBLISHED`}>
          <Card className="p-4 hover:border-slate-700 transition-colors">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 mb-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
            </div>
            <p className="text-2xl font-bold text-slate-100">{publishedCount}</p>
            <p className="text-xs text-slate-500 mt-0.5">Publicados</p>
          </Card>
        </Link>
        <Link href={`/businesses/${params.slug}/posts?status=FAILED`}>
          <Card className={`p-4 hover:border-slate-700 transition-colors ${failedCount > 0 ? "border-red-500/20" : ""}`}>
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg mb-2 ${failedCount > 0 ? "bg-red-500/10" : "bg-slate-500/10"}`}>
              <AlertCircle className={`h-4 w-4 ${failedCount > 0 ? "text-red-400" : "text-slate-500"}`} />
            </div>
            <p className="text-2xl font-bold text-slate-100">{failedCount}</p>
            <p className="text-xs text-slate-500 mt-0.5">Con errores</p>
          </Card>
        </Link>
      </div>

      {/* Main actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          href={`/businesses/${params.slug}/upload`}
          className="flex items-center gap-3 bg-brand-500 text-white rounded-xl px-5 py-4 hover:bg-brand-400 hover:shadow-glow transition-all"
        >
          <Upload className="h-5 w-5" />
          <div>
            <p className="font-semibold text-sm">Subir contenido</p>
            <p className="text-xs text-brand-200">Sube el ZIP del mes</p>
          </div>
        </Link>
        <Link
          href={`/businesses/${params.slug}/posts`}
          className="flex items-center gap-3 bg-surface-card border border-slate-800 rounded-xl px-5 py-4 hover:border-slate-700 hover:bg-surface-hover transition-all"
        >
          <Clock className="h-5 w-5 text-slate-500" />
          <div>
            <p className="font-semibold text-sm text-slate-200">Ver publicaciones</p>
            <p className="text-xs text-slate-500">Gestiona tus posts</p>
          </div>
        </Link>
      </div>

      {/* Recent uploads */}
      {business.uploadBatches.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-300">Contenido subido recientemente</h2>
            <Link href={`/businesses/${params.slug}/batches`} className="text-xs text-brand-400 hover:text-brand-300">
              Ver todo
            </Link>
          </div>
          <div className="space-y-2">
            {business.uploadBatches.map((batch) => (
              <Link
                key={batch.id}
                href={`/businesses/${params.slug}/batches/${batch.id}`}
                className="flex items-center gap-3 bg-surface-card border border-slate-800 rounded-lg px-4 py-3 hover:border-slate-700 transition-all"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{batch.originalFilename}</p>
                  <p className="text-xs text-slate-500">{formatDate(batch.createdAt)} · {batch.validPosts ?? 0} posts validos</p>
                </div>
                <BatchStatusPill status={batch.status} />
                <ChevronRight className="h-4 w-4 text-slate-600" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BatchStatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    PARSED:            { label: "Listo", cls: "bg-green-500/20 text-green-400" },
    VALIDATION_FAILED: { label: "Con errores", cls: "bg-red-500/20 text-red-400" },
    PARSING:           { label: "Procesando...", cls: "bg-blue-500/20 text-blue-400" },
    CONFIRMED:         { label: "Programado", cls: "bg-green-500/20 text-green-400" },
  };
  const s = map[status] ?? { label: status, cls: "bg-slate-500/20 text-slate-400" };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.cls}`}>{s.label}</span>;
}
