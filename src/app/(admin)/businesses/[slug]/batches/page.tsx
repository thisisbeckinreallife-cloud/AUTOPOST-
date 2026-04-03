import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
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
          <h1 className="text-2xl font-bold text-slate-100">
            {business.name} — Subidas
          </h1>
          <p className="text-slate-500 mt-1">{batches.length} batches</p>
        </div>
        <Link href={`/businesses/${params.slug}/upload`}>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Subir ZIP
          </Button>
        </Link>
      </div>

      {batches.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-slate-800 bg-surface-card/50 rounded-2xl animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-brand-500/10 flex items-center justify-center mx-auto mb-4">
            <Plus className="h-8 w-8 text-brand-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-200 mb-1">Aun no has subido contenido</h3>
          <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">Sube un archivo ZIP con tus posts organizados por carpetas</p>
          <Link
            href={`/businesses/${params.slug}/upload`}
            className="inline-flex items-center gap-2 bg-brand-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-400 hover:shadow-glow transition-all"
          >
            <Plus className="h-4 w-4" />
            Subir ZIP
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {batches.map((batch) => (
            <Link
              key={batch.id}
              href={`/businesses/${params.slug}/batches/${batch.id}`}
            >
              <Card className="hover:border-slate-700 transition-all cursor-pointer">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-200">
                        {batch.originalFilename}
                      </p>
                      <p className="text-sm text-slate-500">
                        {formatDate(batch.createdAt)} &middot;{" "}
                        {(batch.fileSize / 1024 / 1024).toFixed(1)} MB &middot;{" "}
                        {batch._count.postDrafts} posts
                      </p>
                      {batch.validPosts !== null && (
                        <p className="text-xs text-slate-500">
                          {batch.validPosts} validos / {batch.failedPosts ?? 0} errores
                        </p>
                      )}
                    </div>
                    <StatusBadge status={batch.status} />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
