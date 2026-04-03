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

      <div className="flex items-center justify-between animate-stagger-in delay-0">
        <div>
          <h1 className="text-2xl font-black text-slate-100">
            {business.name} — Subidas
          </h1>
          <p className="text-slate-500 mt-1"><span className="text-slate-300 font-bold">{batches.length}</span> subidas</p>
        </div>
        <Link
          href={`/businesses/${params.slug}/upload`}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-500 to-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:shadow-glow-lg hover:scale-105 transition-all duration-300"
        >
          <Plus className="h-4 w-4" />
          Subir ZIP
        </Link>
      </div>

      {batches.length === 0 ? (
        <div className="relative text-center py-24 border border-dashed border-slate-700 bg-surface-card/50 rounded-2xl animate-card-appear overflow-hidden bg-dots">
          <div className="absolute inset-0 bg-gradient-to-t from-surface-primary/80 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto mb-5 animate-float">
              <Upload className="h-10 w-10 text-brand-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-100 mb-2">Aun no has subido contenido</h3>
            <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">Sube un archivo ZIP con tus posts organizados por carpetas</p>
            <Link
              href={`/businesses/${params.slug}/upload`}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-500 to-brand-600 text-white px-6 py-3 rounded-xl text-sm font-bold hover:shadow-glow-lg hover:scale-105 transition-all duration-300"
            >
              <Plus className="h-4 w-4" />
              Subir ZIP
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {batches.map((batch, i) => (
            <Link
              key={batch.id}
              href={`/businesses/${params.slug}/batches/${batch.id}`}
            >
              <div className={`group flex items-center justify-between gap-4 rounded-xl border border-slate-800/80 bg-surface-card px-5 py-4 card-hover animate-stagger-in delay-${Math.min(i + 1, 8)}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-brand-500/10 group-hover:scale-110 transition-all duration-300">
                    <Package className="h-5 w-5 text-slate-400 group-hover:text-brand-400 transition-colors duration-300" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-200 truncate group-hover:text-white transition-colors">
                      {batch.originalFilename}
                    </p>
                    <p className="text-sm text-slate-500">
                      {formatDate(batch.createdAt)} · {(batch.fileSize / 1024 / 1024).toFixed(1)} MB · {batch._count.postDrafts} posts
                    </p>
                    {batch.validPosts !== null && (
                      <p className="text-xs text-slate-500">
                        <span className="text-green-400">{batch.validPosts} validos</span> / <span className="text-red-400">{batch.failedPosts ?? 0} errores</span>
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <StatusBadge status={batch.status} />
                  <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-brand-400 group-hover:translate-x-0.5 transition-all duration-300" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
