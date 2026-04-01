import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Instagram, Upload, CheckCircle, AlertCircle, Clock, ChevronRight } from "lucide-react";

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
        <div className="h-14 w-14 rounded-full bg-pink-100 flex items-center justify-center shrink-0">
          <span className="text-pink-600 font-bold text-2xl uppercase">{business.name[0]}</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{business.name}</h1>
          {business.metaConnection?.igUsername && (
            <p className="text-slate-400 text-sm flex items-center gap-1">
              <Instagram className="h-3.5 w-3.5" />
              @{business.metaConnection.igUsername}
            </p>
          )}
        </div>
      </div>

      {/* Alerts */}
      {searchParams.connected === "1" && (
        <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          ¡Tu cuenta de Instagram se ha conectado correctamente!
        </div>
      )}
      {searchParams.error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          ⚠️ {decodeURIComponent(searchParams.error)}
        </div>
      )}

      {/* Connection status */}
      <div className={`rounded-xl border p-5 ${connected ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {connected ? (
              <CheckCircle className="h-6 w-6 text-green-500" />
            ) : (
              <AlertCircle className="h-6 w-6 text-amber-500" />
            )}
            <div>
              <p className="font-semibold text-slate-800">
                {connected ? "Instagram conectado ✓" : "Instagram no conectado"}
              </p>
              <p className="text-sm text-slate-500">
                {connected
                  ? `@${business.metaConnection?.igUsername} · ${business.metaConnection?.fbPageName ?? ""}`
                  : "Conecta tu cuenta para empezar a publicar automáticamente"}
              </p>
              {business.metaConnection?.lastError && (
                <p className="text-xs text-red-600 mt-1">⚠️ {business.metaConnection.lastError}</p>
              )}
            </div>
          </div>
          <Link
            href={`/businesses/${params.slug}/connect`}
            className="text-sm font-medium text-pink-500 hover:text-pink-600 whitespace-nowrap"
          >
            {connected ? "Reconectar" : "Conectar →"}
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Link href={`/businesses/${params.slug}/posts?status=SCHEDULED`} className="bg-white border border-slate-200 rounded-xl p-4 hover:border-pink-300 transition-colors">
          <Clock className="h-5 w-5 text-blue-400 mb-2" />
          <p className="text-2xl font-bold text-slate-900">{upcomingCount}</p>
          <p className="text-xs text-slate-400 mt-0.5">Programados</p>
        </Link>
        <Link href={`/businesses/${params.slug}/posts?status=PUBLISHED`} className="bg-white border border-slate-200 rounded-xl p-4 hover:border-pink-300 transition-colors">
          <CheckCircle className="h-5 w-5 text-green-400 mb-2" />
          <p className="text-2xl font-bold text-slate-900">{publishedCount}</p>
          <p className="text-xs text-slate-400 mt-0.5">Publicados</p>
        </Link>
        <Link href={`/businesses/${params.slug}/posts?status=FAILED`} className={`border rounded-xl p-4 hover:border-pink-300 transition-colors ${failedCount > 0 ? "bg-red-50 border-red-200" : "bg-white border-slate-200"}`}>
          <AlertCircle className={`h-5 w-5 mb-2 ${failedCount > 0 ? "text-red-400" : "text-slate-300"}`} />
          <p className="text-2xl font-bold text-slate-900">{failedCount}</p>
          <p className="text-xs text-slate-400 mt-0.5">Con errores</p>
        </Link>
      </div>

      {/* Main actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href={`/businesses/${params.slug}/upload`}
          className="flex items-center gap-3 bg-pink-500 text-white rounded-xl px-5 py-4 hover:bg-pink-600 transition-colors"
        >
          <Upload className="h-5 w-5" />
          <div>
            <p className="font-semibold text-sm">Subir contenido</p>
            <p className="text-xs text-pink-200">Sube el ZIP del mes</p>
          </div>
        </Link>
        <Link
          href={`/businesses/${params.slug}/posts`}
          className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-5 py-4 hover:border-pink-300 transition-colors"
        >
          <Clock className="h-5 w-5 text-slate-400" />
          <div>
            <p className="font-semibold text-sm text-slate-800">Ver publicaciones</p>
            <p className="text-xs text-slate-400">Gestiona tus posts</p>
          </div>
        </Link>
      </div>

      {/* Recent uploads */}
      {business.uploadBatches.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-700">Contenido subido recientemente</h2>
            <Link href={`/businesses/${params.slug}/batches`} className="text-xs text-pink-500 hover:text-pink-600">
              Ver todo →
            </Link>
          </div>
          <div className="space-y-2">
            {business.uploadBatches.map((batch) => (
              <Link
                key={batch.id}
                href={`/businesses/${params.slug}/batches/${batch.id}`}
                className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg px-4 py-3 hover:border-pink-300 transition-all"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{batch.originalFilename}</p>
                  <p className="text-xs text-slate-400">{formatDate(batch.createdAt)} · {batch.validPosts ?? 0} posts válidos</p>
                </div>
                <BatchStatusPill status={batch.status} />
                <ChevronRight className="h-4 w-4 text-slate-300" />
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
    PARSED:            { label: "Listo", cls: "bg-green-100 text-green-700" },
    VALIDATION_FAILED: { label: "Con errores", cls: "bg-red-100 text-red-700" },
    PARSING:           { label: "Procesando...", cls: "bg-blue-100 text-blue-700" },
    CONFIRMED:         { label: "Programado", cls: "bg-green-100 text-green-700" },
  };
  const s = map[status] ?? { label: status, cls: "bg-slate-100 text-slate-600" };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.cls}`}>{s.label}</span>;
}
