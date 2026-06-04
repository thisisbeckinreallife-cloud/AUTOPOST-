import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
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
  await requireAuth();

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
          <h1 className="font-display text-xl font-bold text-ink-9">
            {business.name} — Subidas
          </h1>
          <p className="text-ink-7 mt-1 text-sm">
            <span className="text-ink-9 font-semibold">{batches.length}</span> subidas
          </p>
        </div>
        <Link
          href={`/businesses/${params.slug}/chat`}
          className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-ink-0 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:-translate-y-px hover:shadow-lg"
        >
          <Plus className="h-4 w-4" />
          Subir con IA
        </Link>
      </div>

      {batches.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-ink-4 bg-ink-2 rounded-2xl animate-fade-up">
          <div className="w-16 h-16 rounded-2xl bg-ink-3 border border-ink-4 flex items-center justify-center mx-auto mb-5">
            <Upload className="h-8 w-8 text-ink-8" />
          </div>
          <h3 className="text-lg font-semibold text-ink-9 mb-2">Aún no has subido contenido</h3>
          <p className="text-ink-7 text-sm mb-6 max-w-xs mx-auto">Sube tu contenido en el chat — la IA agrupa carruseles, propone calendario y publica</p>
          <Link
            href={`/businesses/${params.slug}/chat`}
            className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-ink-0 px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:-translate-y-px hover:shadow-lg"
          >
            <Plus className="h-4 w-4" />
            Subir con IA
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {batches.map((batch) => (
            <Link
              key={batch.id}
              href={`/businesses/${params.slug}/batches/${batch.id}`}
              className="group block rounded-xl border border-ink-4 bg-ink-2 px-4 py-3.5 hover:border-ink-4 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-xl bg-ink-3 flex items-center justify-center shrink-0 group-hover:bg-ink-3 transition-colors">
                    <Package className="h-5 w-5 text-ink-8" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-ink-9 truncate">
                      {batch.originalFilename}
                    </p>
                    <p className="text-sm text-ink-7">
                      {formatDate(batch.createdAt)} · {(batch.fileSize / 1024 / 1024).toFixed(1)} MB · {batch._count.postDrafts} posts
                    </p>
                    {batch.validPosts !== null && (
                      <p className="text-xs mt-0.5">
                        <span className="text-success font-semibold">{batch.validPosts} válidos</span>
                        <span className="text-ink-6 mx-1">·</span>
                        <span className={(batch.failedPosts ?? 0) > 0 ? "text-error font-semibold" : "text-ink-6"}>
                          {batch.failedPosts ?? 0} errores
                        </span>
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <StatusBadge status={batch.status} />
                  <ChevronRight className="h-4 w-4 text-ink-6 group-hover:text-ink-8 transition-colors" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
