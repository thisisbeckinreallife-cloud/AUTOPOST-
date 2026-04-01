import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Instagram, Upload, List, AlertTriangle } from "lucide-react";

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
        select: {
          id: true,
          igUserId: true,
          igUsername: true,
          fbPageId: true,
          fbPageName: true,
          status: true,
          tokenExpiresAt: true,
          lastCheckedAt: true,
          lastError: true,
        },
      },
      uploadBatches: {
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          originalFilename: true,
          status: true,
          totalPosts: true,
          validPosts: true,
          createdAt: true,
        },
      },
      _count: {
        select: {
          postDrafts: true,
          uploadBatches: true,
        },
      },
    },
  });

  if (!business) notFound();

  const postsByStatus = await db.postDraft.groupBy({
    by: ["status"],
    where: { businessId: business.id },
    _count: { status: true },
  });

  const statusCounts = Object.fromEntries(
    postsByStatus.map((s) => [s.status, s._count.status])
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-brand-100 flex items-center justify-center">
              <span className="text-brand-700 font-bold text-xl uppercase">
                {business.name[0]}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {business.name}
              </h1>
              <p className="text-slate-500 text-sm">
                /{business.slug} &middot; {business.timezone}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/businesses/${params.slug}/upload`}>
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Upload ZIP
            </Button>
          </Link>
          <Link href={`/businesses/${params.slug}/posts`}>
            <Button variant="outline" size="sm">
              <List className="h-4 w-4 mr-2" />
              All Posts
            </Button>
          </Link>
        </div>
      </div>

      {/* Alerts */}
      {searchParams.connected === "1" && (
        <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          Instagram account connected successfully.
        </div>
      )}
      {searchParams.error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          Connection error: {decodeURIComponent(searchParams.error)}
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Meta Connection */}
        <div className="col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Instagram className="h-5 w-5 text-pink-500" />
                  Instagram Connection
                </CardTitle>
                <Link href={`/businesses/${params.slug}/connect`}>
                  <Button variant="outline" size="sm">
                    {business.metaConnection ? "Reconnect" : "Connect"}
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {business.metaConnection ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <StatusBadge status={business.metaConnection.status} />
                    <span className="font-medium">
                      @{business.metaConnection.igUsername}
                    </span>
                  </div>
                  {business.metaConnection.fbPageName && (
                    <p className="text-sm text-slate-500">
                      Page: {business.metaConnection.fbPageName}
                    </p>
                  )}
                  {business.metaConnection.tokenExpiresAt && (
                    <p className="text-sm text-slate-500">
                      Token expires:{" "}
                      {formatDate(business.metaConnection.tokenExpiresAt)}
                    </p>
                  )}
                  {business.metaConnection.lastError && (
                    <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 rounded p-2">
                      <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                      {business.metaConnection.lastError}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-slate-500 text-sm">
                  No Instagram account connected. Connect via Meta OAuth to
                  enable publishing.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent batches */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Imports</CardTitle>
                <Link href={`/businesses/${params.slug}/batches`}>
                  <Button variant="ghost" size="sm">
                    View all
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {business.uploadBatches.length === 0 ? (
                <p className="text-slate-400 text-sm">No imports yet.</p>
              ) : (
                <div className="space-y-2">
                  {business.uploadBatches.map((batch) => (
                    <Link
                      key={batch.id}
                      href={`/businesses/${params.slug}/batches/${batch.id}`}
                      className="flex items-center justify-between py-2 hover:bg-slate-50 rounded px-2 -mx-2 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {batch.originalFilename}
                        </p>
                        <p className="text-xs text-slate-400">
                          {formatDate(batch.createdAt)} &middot;{" "}
                          {batch.validPosts ?? 0} valid posts
                        </p>
                      </div>
                      <StatusBadge status={batch.status} />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stats sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Posts by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(statusCounts).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <StatusBadge status={status} />
                    <span className="font-semibold text-slate-700">{count}</span>
                  </div>
                ))}
                {Object.keys(statusCounts).length === 0 && (
                  <p className="text-slate-400 text-sm">No posts yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
