"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateInTz, formatDate } from "@/lib/utils";
import { AlertTriangle, CheckCircle, Clock, Image, Film, Layers } from "lucide-react";
import type { ParseError } from "@/types";

interface BatchData {
  id: string;
  originalFilename: string;
  status: string;
  parsedAt: string | null;
  totalPosts: number | null;
  validPosts: number | null;
  failedPosts: number | null;
  parseErrors: ParseError[] | null;
  parseWarnings: ParseError[] | null;
  business: { name: string; slug: string; timezone: string };
  postDrafts: PostDraftPreview[];
}

interface PostDraftPreview {
  id: string;
  postType: string;
  caption: string;
  publishAt: string;
  timezone: string;
  status: string;
  sourceFolderName: string;
  validationErrors: unknown[] | null;
  mediaAssets: { id: string; originalFilename: string; mimeType: string; sortOrder: number }[];
}

export default function BatchDetailPage() {
  const { slug, batchId } = useParams<{ slug: string; batchId: string }>();
  const router = useRouter();
  const [batch, setBatch] = useState<BatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [confirmResult, setConfirmResult] = useState<{ scheduled: number; failed: number } | null>(null);
  const [error, setError] = useState("");

  async function fetchBatch() {
    try {
      const res = await fetch(`/api/batches/${batchId}`);
      if (res.ok) {
        const data = await res.json();
        setBatch(data.data);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBatch();
    // Poll while parsing
    const interval = setInterval(() => {
      if (batch?.status === "PARSING" || batch?.status === "UPLOADED") {
        fetchBatch();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [batchId, batch?.status]);

  async function handleConfirm() {
    setConfirming(true);
    setError("");
    try {
      const res = await fetch(`/api/batches/${batchId}/confirm`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to confirm batch");
        return;
      }
      setConfirmResult(data.data);
      await fetchBatch();
    } catch {
      setError("Network error");
    } finally {
      setConfirming(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-400">
        Loading...
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="text-slate-500">Batch not found.</div>
    );
  }

  const canConfirm = ["PARSED", "VALIDATION_FAILED"].includes(batch.status);
  const hasErrors = (batch.parseErrors?.length ?? 0) > 0;
  const hasWarnings = (batch.parseWarnings?.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {batch.originalFilename}
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            {batch.business.name} &middot; Batch {batchId.slice(0, 8)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={batch.status} />
          {canConfirm && (batch.validPosts ?? 0) > 0 && (
            <Button
              onClick={handleConfirm}
              loading={confirming}
            >
              Confirm & Schedule {batch.validPosts} posts
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      {batch.totalPosts !== null && (
        <div className="grid grid-cols-3 gap-4">
          <StatBox
            icon={<Layers className="h-5 w-5 text-slate-500" />}
            label="Total Posts"
            value={batch.totalPosts}
          />
          <StatBox
            icon={<CheckCircle className="h-5 w-5 text-green-500" />}
            label="Valid"
            value={batch.validPosts ?? 0}
          />
          <StatBox
            icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
            label="Errors"
            value={batch.failedPosts ?? 0}
          />
        </div>
      )}

      {/* Parse status */}
      {(batch.status === "PARSING" || batch.status === "UPLOADED") && (
        <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-md px-4 py-3">
          <Clock className="h-4 w-4 animate-pulse" />
          Processing ZIP... this may take a moment.
        </div>
      )}

      {/* Confirm result */}
      {confirmResult && (
        <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          Scheduled {confirmResult.scheduled} posts.
          {confirmResult.failed > 0 && ` ${confirmResult.failed} failed.`}
        </div>
      )}

      {/* Errors */}
      {hasErrors && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-base text-red-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Parse Errors ({batch.parseErrors!.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {batch.parseErrors!.map((e, i) => (
                <div key={i} className="text-sm">
                  <span className="font-mono text-xs bg-red-50 text-red-600 px-1.5 py-0.5 rounded">
                    {e.folder}
                  </span>
                  {e.field && (
                    <span className="ml-1 text-slate-400 text-xs">[{e.field}]</span>
                  )}
                  <span className="ml-2 text-slate-700">{e.message}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warnings */}
      {hasWarnings && (
        <Card className="border-amber-200">
          <CardHeader>
            <CardTitle className="text-base text-amber-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Warnings ({batch.parseWarnings!.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {batch.parseWarnings!.map((w, i) => (
                <div key={i} className="text-sm">
                  <span className="font-mono text-xs bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded">
                    {w.folder}
                  </span>
                  <span className="ml-2 text-slate-700">{w.message}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Post drafts */}
      {batch.postDrafts.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">
            Posts ({batch.postDrafts.length})
          </h2>
          <div className="space-y-3">
            {batch.postDrafts.map((post) => (
              <a
                key={post.id}
                href={`/businesses/${slug}/posts/${post.id}`}
                className="block"
              >
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="py-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="mt-0.5">
                          {post.postType === "REEL" ? (
                            <Film className="h-5 w-5 text-purple-500" />
                          ) : post.postType === "CAROUSEL" ? (
                            <Layers className="h-5 w-5 text-blue-500" />
                          ) : (
                            <Image className="h-5 w-5 text-green-500" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-800 text-sm truncate">
                            {post.sourceFolderName}
                          </p>
                          <p className="text-xs text-slate-500 truncate mt-0.5">
                            {post.caption.slice(0, 100)}
                            {post.caption.length > 100 ? "..." : ""}
                          </p>
                          <p className="text-xs text-blue-600 mt-1">
                            {formatDateInTz(post.publishAt, batch.business.timezone)}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0">
                        <StatusBadge status={post.status} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-3">
          {icon}
          <div>
            <p className="text-xs text-slate-500">{label}</p>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
