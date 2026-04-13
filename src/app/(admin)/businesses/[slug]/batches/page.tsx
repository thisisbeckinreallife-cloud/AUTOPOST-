import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/ui/badge";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Plus, Upload, Package, ChevronRight } from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export const dynamic = "force-dynamic";

export default async function BatchesPage({
  params,
}: {
  params: { slug: string };
}) {
  await requireSession();

  const business = await db.business.findUnique({
    where: { slug: params.slug },
  });
  if (!business) notFound();

  const batches = await db.uploadBatch.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { postDrafts: true } },
    },
  });

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: "Inicio", href: "/dashboard" },
        { label: business.name, href: `/businesses/${params.slug}` },
        { label: "Subidas" },
      ]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-white">
            {business.name} — Subidas
          </h1>
          <p className="text-zinc-500 mt-1"><span className="text-zinc-300 font-semibold">{batches.length}</span> subidas</p>
        </div>
        <Link
          href={`/businesses/${params.slug}/upload`}
          className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus className="h-4 w-4" />
          Subir ZIP
        </Link>
      </div>

      {batches.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-white/[0.08] bg-surface-card rounded-2xl">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto mb-5">
            <Upload className="h-8 w-8 text-brand-400" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-100 mb-2">Aun no has subido contenido</h3>
          <p className="text-zinc-500 text-sm mb-6 max-w-xs mx-auto">Sube un archivo ZIP con tus posts organizados por carpetas</p>
          <Link
            href={`/businesses/${params.slug}/upload`}
            className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-colors"
          >
            <Plus className="h-4 w-4" />
            Subir ZIP
          </Link>
        </div>
      ) : (
        <div className="space-y-1.5">
          {batches.map((batch) => (
            <Link
              key={batch.id}
              href={`/businesses/${params.slug}/batches/${batch.id}`}
            >
              <div className="group flex items-center justify-between gap-4 rounded-xl border border-white/[0.04] bg-surface-card px-4 py-3.5 hover:border-white/[0.08] transition-all">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-xl bg-white/[0.04] flex items-center justify-center shrink-0 group-hover:bg-brand-500/10 transition-colors">
                    <Package className="h-5 w-5 text-zinc-400 group-hover:text-brand-400 transition-colors" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-zinc-200 truncate group-hover:text-white transition-colors">
                      {batch.originalFilename}
                    </p>
                    <p className="text-sm text-zinc-500">
                      {formatDate(batch.createdAt)} · {(batch.fileSize / 1024 / 1024).toFixed(1)} MB · {batch._count.postDrafts} posts
                    </p>
                    {batch.validPosts !== null && (
                      <p className="text-xs text-zinc-500">
                        <span className="text-green-400">{batch.validPosts} validos</span> / <span className="text-red-400">{batch.failedPosts ?? 0} errores</span>
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <StatusBadge status={batch.status} />
                  <ChevronRight className="h-4 w-4 text-zinc-700 group-hover:text-brand-400 transition-colors" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
