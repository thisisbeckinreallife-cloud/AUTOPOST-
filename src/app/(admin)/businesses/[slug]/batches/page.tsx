import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

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
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            No hay subidas todavia.
          </CardContent>
        </Card>
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
