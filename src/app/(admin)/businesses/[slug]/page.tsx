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
      <div className="flex items-center gap-4 animate-fade-up">
        <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-brand-500/10 to-accent-orange/10 border border-brand-500/10 flex items-center justify-center shrink-0">
          <span className="text-zinc-900 font-display font-bold text-xl uppercase">{business.name[0]}</span>
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-zinc-900 tracking-tight">{business.name}</h1>
          {business.metaConnection?.igUsername && (
            <p className="text-zinc-600 text-sm flex items-center gap-1.5 mt-0.5">
              <Instagram className="h-3.5 w-3.5" />
              @{business.metaConnection.igUsername}
            </p>
          )}
        </div>
      </div>

      {/* Alerts */}
      {searchParams.connected === "1" && (
        <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 flex items-center gap-2 animate-fade-in">
          <CheckCircle className="h-4 w-4" />
          Tu cuenta de Instagram se ha conectado correctamente!
        </div>
      )}
      {searchParams.error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 animate-fade-in">
          {decodeURIComponent(searchParams.error)}
        </div>
      )}

      {/* Connection status */}
      <div className={`rounded-xl border bg-white p-5 ${connected ? "border-green-200" : "border-amber-300"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {connected ? (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 border border-green-200">
                <Shield className="h-5 w-5 text-green-700" />
              </div>
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 border border-amber-200">
                <AlertCircle className="h-5 w-5 text-amber-700" />
              </div>
            )}
            <div>
              <p className="font-semibold text-zinc-900">
                {connected ? "Instagram conectado" : "Instagram no conectado"}
              </p>
              <p className="text-sm text-zinc-600">
                {connected
                  ? `@${business.metaConnection?.igUsername} · ${business.metaConnection?.fbPageName ?? ""}`
                  : "Conecta tu cuenta para publicar automaticamente"}
              </p>
              {business.metaConnection?.lastError && (
                <p className="text-xs text-red-700 mt-1">{business.metaConnection.lastError}</p>
              )}
            </div>
          </div>
          <Link
            href={`/businesses/${params.slug}/connect`}
            className={`text-sm font-semibold px-4 py-2 rounded-lg transition-all ${
              connected
                ? "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
                : "bg-zinc-900 hover:bg-zinc-800 text-white"
            }`}
          >
            {connected ? "Reconectar" : "Conectar"}
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fade-up stagger-2">
        <Link href={`/businesses/${params.slug}/posts?status=SCHEDULED`}>
          <div className="group rounded-xl border border-zinc-200 bg-white p-4 hover:border-cyan-300 hover:shadow-md transition-all duration-300">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-100 mb-3">
              <Clock className="h-4 w-4 text-cyan-700" />
            </div>
            <p className="text-2xl font-display font-bold text-zinc-900 tabular-nums">{upcomingCount}</p>
            <p className="text-xs text-zinc-600 mt-0.5 font-medium uppercase tracking-wider">Programados</p>
          </div>
        </Link>
        <Link href={`/businesses/${params.slug}/posts?status=PUBLISHED`}>
          <div className="group rounded-xl border border-zinc-200 bg-white p-4 hover:border-emerald-300 hover:shadow-md transition-all duration-300">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 mb-3">
              <CheckCircle className="h-4 w-4 text-emerald-700" />
            </div>
            <p className="text-2xl font-display font-bold text-zinc-900 tabular-nums">{publishedCount}</p>
            <p className="text-xs text-zinc-600 mt-0.5 font-medium uppercase tracking-wider">Publicados</p>
          </div>
        </Link>
        <Link href={`/businesses/${params.slug}/posts?status=FAILED`}>
          <div className={`group rounded-xl border bg-white p-4 hover:border-zinc-300 hover:shadow-md transition-all ${
            failedCount > 0 ? "border-red-300" : "border-zinc-200"
          }`}>
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg mb-3 ${
              failedCount > 0 ? "bg-red-100" : "bg-zinc-100"
            }`}>
              <AlertCircle className={`h-4 w-4 ${failedCount > 0 ? "text-red-700" : "text-zinc-500"}`} />
            </div>
            <p className="text-2xl font-display font-bold text-zinc-900 tabular-nums">{failedCount}</p>
            <p className="text-xs text-zinc-600 mt-0.5 font-medium uppercase tracking-wider">Con errores</p>
          </div>
        </Link>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-up stagger-3">
        <Link
          href={`/businesses/${params.slug}/upload`}
          className="group flex items-center gap-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl px-5 py-4 transition-all hover:-translate-y-px hover:shadow-lg"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
            <Upload className="h-4 w-4" />
          </div>
          <div>
            <p className="font-semibold text-sm">Subir contenido</p>
            <p className="text-xs text-zinc-300">Sube el ZIP del mes</p>
          </div>
        </Link>
        <Link
          href={`/businesses/${params.slug}/posts`}
          className="group flex items-center gap-4 bg-white border border-zinc-200 rounded-xl px-5 py-4 hover:border-zinc-300 hover:shadow-md transition-all"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 group-hover:bg-zinc-200 transition-colors">
            <BarChart3 className="h-4 w-4 text-zinc-700" />
          </div>
          <div>
            <p className="font-semibold text-sm text-zinc-900 transition-colors">Ver publicaciones</p>
            <p className="text-xs text-zinc-600">Gestiona tus posts</p>
          </div>
        </Link>
      </div>

      {/* Recent uploads */}
      {business.uploadBatches.length > 0 && (
        <div className="">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-zinc-700 uppercase tracking-wider">Subidas recientes</h2>
            <Link href={`/businesses/${params.slug}/batches`} className="text-xs text-zinc-700 hover:text-zinc-900 font-medium transition-colors">
              Ver todo →
            </Link>
          </div>
          <div className="space-y-1.5">
            {business.uploadBatches.map((batch) => (
              <Link
                key={batch.id}
                href={`/businesses/${params.slug}/batches/${batch.id}`}
                className="group flex items-center gap-3 bg-white border border-zinc-200 rounded-lg px-4 py-3 hover:border-zinc-300 hover:shadow-sm transition-all"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 truncate transition-colors">{batch.originalFilename}</p>
                  <p className="text-xs text-zinc-600">{formatDate(batch.createdAt)} · {batch.validPosts ?? 0} posts</p>
                </div>
                <BatchStatusPill status={batch.status} />
                <ChevronRight className="h-4 w-4 text-zinc-400 group-hover:text-zinc-700 transition-all" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Danger zone */}
      <div className="pt-4 border-t border-zinc-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-zinc-700">Zona peligrosa</p>
            <p className="text-xs text-zinc-500 mt-0.5">Eliminar esta cuenta y todos sus datos</p>
          </div>
          <DeleteBusinessButton slug={params.slug} name={business.name} />
        </div>
      </div>
    </div>
  );
}

function BatchStatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    PARSED:            { label: "Listo", cls: "bg-green-100 text-green-800 border-green-300" },
    VALIDATION_FAILED: { label: "Con errores", cls: "bg-red-100 text-red-800 border-red-300" },
    PARSING:           { label: "Procesando...", cls: "bg-blue-100 text-blue-800 border-blue-300" },
    CONFIRMED:         { label: "Programado", cls: "bg-green-100 text-green-800 border-green-300" },
  };
  const s = map[status] ?? { label: status, cls: "bg-zinc-100 text-zinc-700 border-zinc-300" };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${s.cls}`}>{s.label}</span>;
}
