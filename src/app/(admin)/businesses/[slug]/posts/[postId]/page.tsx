"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { AlertTriangle, RefreshCw, XCircle, ExternalLink } from "lucide-react";
import { PostDetailSkeleton } from "@/components/ui/skeleton";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { useToast } from "@/components/ui/toast";

interface PostDetail {
  id: string;
  postType: string;
  caption: string;
  publishAt: string;
  timezone: string;
  status: string;
  firstComment: string | null;
  sourceFolderName: string;
  metaPermalink: string | null;
  metaPublicationId: string | null;
  lastError: string | null;
  attemptCount: number;
  publishedAt: string | null;
  failedAt: string | null;
  validationErrors: unknown[] | null;
  mediaAssets: MediaAsset[];
  publishJobs: PublishJobDetail[];
  business: { name: string; slug: string; timezone: string };
  batch: { id: string; originalFilename: string };
}

interface MediaAsset {
  id: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  sortOrder: number;
  storageUrl: string;
}

interface PublishJobDetail {
  id: string;
  status: string;
  scheduledFor: string;
  bullmqJobId: string | null;
  attempts: Attempt[];
}

interface Attempt {
  id: string;
  attemptNumber: number;
  startedAt: string;
  finishedAt: string | null;
  success: boolean | null;
  errorCode: string | null;
  errorMessage: string | null;
}

export default function PostDetailPage() {
  const { slug, postId } = useParams() as { slug: string; postId: string };
  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  async function fetchPost() {
    try {
      const res = await fetch(`/api/posts/${postId}`);
      if (res.ok) {
        const data = await res.json();
        setPost(data.data);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPost();
  }, [postId]);

  async function handleRetry() {
    setRetrying(true);
    setError("");
    try {
      const res = await fetch(`/api/posts/${postId}/retry`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to retry");
        toast(data.error ?? "No se pudo reintentar", "error");
        return;
      }
      toast("Reintento programado", "success");
      await fetchPost();
    } catch {
      setError("Network error");
    } finally {
      setRetrying(false);
    }
  }

  async function handleCancel() {
    setCancelling(true);
    setError("");
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to cancel");
        toast(data.error ?? "No se pudo cancelar", "error");
        return;
      }
      toast("Publicacion cancelada", "info");
      await fetchPost();
    } catch {
      setError("Network error");
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return <PostDetailSkeleton />;
  }

  if (!post) {
    return <div className="text-slate-500">Post no encontrado.</div>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Breadcrumb items={[
        { label: "Inicio", href: "/dashboard" },
        { label: post.business.name, href: `/businesses/${slug}` },
        { label: "Posts", href: `/businesses/${slug}/posts` },
        { label: post.sourceFolderName },
      ]} />
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">
            {post.sourceFolderName}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {post.business.name} &middot; {post.postType}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={post.status} />
          {post.status === "FAILED" && (
            <Button size="sm" onClick={handleRetry} loading={retrying}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Reintentar
            </Button>
          )}
          {["DRAFT", "VALIDATED", "READY", "SCHEDULED"].includes(post.status) && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              loading={cancelling}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Published link */}
      {post.metaPermalink && (
        <div className="rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-3 flex items-center gap-2">
          <span className="text-green-400 text-sm">Publicado en Instagram</span>
          <a
            href={post.metaPermalink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-green-400 text-sm font-medium hover:underline"
          >
            Ver post <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}

      {/* Last error */}
      {post.lastError && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
          <p className="text-sm text-red-400">{post.lastError}</p>
        </div>
      )}

      {/* Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalles del post</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-3 text-sm">
            <Row label="Programado para">
              {formatDate(post.publishAt)} ({post.business.timezone})
            </Row>
            <Row label="Tipo">{post.postType}</Row>
            <Row label="Media">
              {post.mediaAssets.length} archivo{post.mediaAssets.length !== 1 ? "s" : ""}
            </Row>
            <Row label="Intentos">{post.attemptCount}</Row>
            {post.publishedAt && (
              <Row label="Publicado">{formatDate(post.publishedAt)}</Row>
            )}
            {post.metaPublicationId && (
              <Row label="Meta Media ID">{post.metaPublicationId}</Row>
            )}
            <Row label="Batch">
              <a
                href={`/businesses/${slug}/batches/${post.batch.id}`}
                className="text-brand-400 hover:underline"
              >
                {post.batch.originalFilename}
              </a>
            </Row>
          </dl>
        </CardContent>
      </Card>

      {/* Caption */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Caption</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap text-sm text-slate-300 font-sans">
            {post.caption}
          </pre>
        </CardContent>
      </Card>

      {/* Media assets */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Archivos multimedia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {post.mediaAssets.map((asset) => (
              <div key={asset.id} className="flex items-center gap-3 text-sm">
                <span className="text-slate-500 text-xs">{asset.sortOrder + 1}.</span>
                <span className="font-medium text-slate-200">
                  {asset.originalFilename}
                </span>
                <span className="text-slate-500 text-xs">{asset.mimeType}</span>
                <span className="text-slate-500 text-xs">
                  {(asset.fileSize / 1024).toFixed(0)} KB
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Publish jobs & attempts */}
      {post.publishJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Historial de publicacion</CardTitle>
          </CardHeader>
          <CardContent>
            {post.publishJobs.map((job) => (
              <div key={job.id} className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <StatusBadge status={job.status} />
                  <span className="text-xs text-slate-500">
                    Job {job.id.slice(0, 8)} &middot; Programado {formatDate(job.scheduledFor)}
                  </span>
                </div>
                {job.attempts.map((attempt) => (
                  <div
                    key={attempt.id}
                    className="ml-4 pl-4 border-l border-slate-800 py-1"
                  >
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className={
                          attempt.success === true
                            ? "text-green-400"
                            : attempt.success === false
                            ? "text-red-400"
                            : "text-slate-500"
                        }
                      >
                        Intento #{attempt.attemptNumber}
                      </span>
                      <span className="text-slate-500">
                        {formatDate(attempt.startedAt)}
                      </span>
                    </div>
                    {attempt.errorMessage && (
                      <p className="text-xs text-red-400 mt-1">
                        {attempt.errorCode && (
                          <span className="font-mono mr-1">[{attempt.errorCode}]</span>
                        )}
                        {attempt.errorMessage}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <dt className="w-36 text-slate-500 shrink-0">{label}</dt>
      <dd className="text-slate-200">{children}</dd>
    </div>
  );
}
