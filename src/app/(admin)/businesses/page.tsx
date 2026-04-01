import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import Link from "next/link";
import { Plus, ChevronRight, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function BusinessesPage() {
  await requireSession();

  const businesses = await db.business.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      metaConnection: {
        select: { igUsername: true, status: true },
      },
      _count: {
        select: {
          postDrafts: true,
          uploadBatches: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Businesses</h1>
          <p className="text-slate-500 mt-1">
            {businesses.length} business{businesses.length !== 1 ? "es" : ""}
          </p>
        </div>
        <Link href="/businesses/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Business
          </Button>
        </Link>
      </div>

      {businesses.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Globe className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No businesses yet.</p>
            <Link href="/businesses/new" className="mt-4 inline-block">
              <Button variant="outline" size="sm">
                Create your first business
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {businesses.map((biz) => (
            <Link key={biz.id} href={`/businesses/${biz.slug}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center">
                        <span className="text-brand-700 font-bold text-lg uppercase">
                          {biz.name[0]}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="font-semibold text-slate-900">{biz.name}</h2>
                          {!biz.isActive && (
                            <StatusBadge status="CANCELLED" />
                          )}
                        </div>
                        <p className="text-sm text-slate-500">
                          /{biz.slug} &middot; {biz.timezone}
                        </p>
                        {biz.metaConnection && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            @{biz.metaConnection.igUsername} &middot;{" "}
                            <StatusBadge status={biz.metaConnection.status} />
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-slate-500">
                      <div className="text-center">
                        <div className="font-semibold text-slate-900">
                          {biz._count.postDrafts}
                        </div>
                        <div className="text-xs">Posts</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-slate-900">
                          {biz._count.uploadBatches}
                        </div>
                        <div className="text-xs">Batches</div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </div>
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
