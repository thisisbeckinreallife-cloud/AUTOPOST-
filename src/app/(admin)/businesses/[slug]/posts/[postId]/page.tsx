"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { AlertTriangle, RefreshCw, XCircle, ExternalLink, Film, Image as ImageIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { PostDetailSkeleton } from "@/components/ui/skeleton";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { useToast } from "@/components/ui/toast";
import { AiCaptionStudio } from "@/components/admin/AiCaptionStudio";
import { AiImageStudio } from "@/components/admin/AiImageStudio";
import { RequestApprovalPanel } from "@/components/admin/RequestApprovalPanel";

interface PostDetail {
  id: string;
  postType: string;
  caption: string;
  publishAt: string;
  timezone: string;
  status: string;
  approvalStatus: string;
  rejectionReason: string | null;
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
  business: { id: string; name: string; slug: string; timezone: string };
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
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const { toast } = useToast();

  const sortedAssets = post
    ? post.mediaAssets.slice().sort((a, b) => a.sortOrder - b.sortOrder)
    : [];
  const lightboxAsset = lightboxIndex !== null ? sortedAssets[lightboxIndex] : null;

  function openLightbox(asset: MediaAsset) {
    const idx = sortedAssets.findIndex((a) => a.id === asset.id);
    if (idx >= 0) setLightboxIndex(idx);
  }
  function closeLightbox() {
    setLightboxIndex(null);
  }
  function lightboxPrev() {
    if (lightboxIndex === null) return;
    setLightboxIndex((i) => (i === null ? null : (i - 1 + sortedAssets.length) % sortedAssets.length));
  }
  function lightboxNext() {
    if (lightboxIndex === null) return;
    setLightboxIndex((i) => (i === null ? null : (i + 1) % sortedAssets.length));
  }

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowLeft") lightboxPrev();
      else if (e.key === "ArrowRight") lightboxNext();
    }
    document.addEventListener("keydown", onKey);
    // Lock body scroll while lightbox open
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxIndex, sortedAssets.length]);

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
    return <div className="text-zinc-500">Post no encontrado.</div>;
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
          <h1 className="font-display text-xl font-bold text-zinc-900">
            {post.sourceFolderName}
          </h1>
          <p className="text-zinc-600 text-sm mt-1">
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
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Published link */}
      {post.metaPermalink && (
        <a
          href={post.metaPermalink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-xl bg-green-50 border border-green-300 px-4 py-3 hover:border-green-400 hover:bg-green-100 transition-colors group"
        >
          <span className="text-green-800 text-sm font-semibold">Publicado en Instagram</span>
          <span className="inline-flex items-center gap-1 text-green-800 text-sm font-semibold">
            Ver post en Instagram
            <ExternalLink className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </a>
      )}

      {/* Last error */}
      {post.lastError && (
        <div className="rounded-xl bg-red-50 border border-red-300 px-4 py-3 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-red-700 mt-0.5 shrink-0" />
          <p className="text-sm text-red-800">{post.lastError}</p>
        </div>
      )}

      {/* Media preview — grid */}
      {post.mediaAssets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {post.mediaAssets.length === 1
                ? "Media"
                : `Carrusel · ${post.mediaAssets.length} piezas`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`grid gap-3 ${
                post.mediaAssets.length === 1
                  ? "grid-cols-1 max-w-sm mx-auto"
                  : "grid-cols-2 sm:grid-cols-3"
              }`}
            >
              {sortedAssets.map((asset) => (
                <MediaThumb
                  key={asset.id}
                  asset={asset}
                  onOpen={() => openLightbox(asset)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Caption */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Caption</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap text-sm text-zinc-800 font-sans leading-relaxed">
            {post.caption}
          </pre>
        </CardContent>
      </Card>

      {/* Estudio editorial AI — sólo para posts editables */}
      {["DRAFT", "VALIDATED", "READY"].includes(post.status) && (
        <>
          <AiCaptionStudio
            postId={post.id}
            businessId={post.business.id}
            currentCaption={post.caption}
            onApplied={(newCaption) =>
              setPost((p) => (p ? { ...p, caption: newCaption } : p))
            }
          />
          <AiImageStudio
            businessId={post.business.id}
            postDraftId={post.id}
            onAssetSaved={() => fetchPost()}
          />
        </>
      )}

      {/* Aprobación del cliente — magic-link */}
      {["DRAFT", "VALIDATED", "READY", "SCHEDULED"].includes(post.status) && (
        <RequestApprovalPanel
          postId={post.id}
          approvalStatus={post.approvalStatus}
          rejectionReason={post.rejectionReason}
        />
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
              <Row label="Meta Media ID">
                <span className="font-mono text-xs">{post.metaPublicationId}</span>
              </Row>
            )}
            <Row label="Batch">
              <a
                href={`/businesses/${slug}/batches/${post.batch.id}`}
                className="text-zinc-900 hover:underline font-medium"
              >
                {post.batch.originalFilename}
              </a>
            </Row>
          </dl>
        </CardContent>
      </Card>

      {/* Publish jobs & attempts */}
      {post.publishJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Historial de publicación</CardTitle>
          </CardHeader>
          <CardContent>
            {post.publishJobs.map((job) => (
              <div key={job.id} className="mb-4 last:mb-0">
                <div className="flex items-center gap-2 mb-2">
                  <StatusBadge status={job.status} />
                  <span className="text-xs text-zinc-600">
                    Job <span className="font-mono">{job.id.slice(0, 8)}</span> · Programado {formatDate(job.scheduledFor)}
                  </span>
                </div>
                {job.attempts.map((attempt) => (
                  <div
                    key={attempt.id}
                    className="ml-4 pl-4 border-l border-zinc-200 py-1.5"
                  >
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className={
                          attempt.success === true
                            ? "text-green-700 font-semibold"
                            : attempt.success === false
                            ? "text-red-700 font-semibold"
                            : "text-zinc-600 font-semibold"
                        }
                      >
                        Intento #{attempt.attemptNumber}
                      </span>
                      <span className="text-zinc-500">
                        {formatDate(attempt.startedAt)}
                      </span>
                    </div>
                    {attempt.errorMessage && (
                      <p className="text-xs text-red-700 mt-1">
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

      {/* Lightbox */}
      {lightboxAsset && lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 cursor-zoom-out"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label={`Vista ampliada — ${lightboxIndex + 1} de ${sortedAssets.length}`}
        >
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            aria-label="Cerrar (Escape)"
          >
            <XCircle className="h-6 w-6" />
          </button>

          {sortedAssets.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); lightboxPrev(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                aria-label="Anterior (flecha izquierda)"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); lightboxNext(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                aria-label="Siguiente (flecha derecha)"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
              <div
                className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/60 text-white text-xs font-mono tabular-nums"
                aria-live="polite"
              >
                {lightboxIndex + 1} / {sortedAssets.length}
              </div>
            </>
          )}

          <div
            className="max-w-5xl max-h-[90vh] w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {lightboxAsset.mimeType.startsWith("image/") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={lightboxAsset.storageUrl}
                alt={lightboxAsset.originalFilename}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              />
            ) : lightboxAsset.mimeType.startsWith("video/") ? (
              <video
                key={lightboxAsset.id}
                src={lightboxAsset.storageUrl}
                controls
                autoPlay
                className="max-w-full max-h-full rounded-lg shadow-2xl"
              />
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

function MediaThumb({ asset, onOpen }: { asset: MediaAsset; onOpen: () => void }) {
  const [broken, setBroken] = useState(false);
  const isImage = asset.mimeType.startsWith("image/");
  const isVideo = asset.mimeType.startsWith("video/");
  const sizeKb = (asset.fileSize / 1024).toFixed(0);

  if (broken || (!isImage && !isVideo)) {
    return (
      <div className="aspect-square rounded-lg border border-zinc-200 bg-zinc-50 flex flex-col items-center justify-center text-center p-3">
        {isVideo ? <Film className="h-6 w-6 text-zinc-400 mb-2" /> : <ImageIcon className="h-6 w-6 text-zinc-400 mb-2" />}
        <p className="text-[11px] text-zinc-600 font-medium truncate w-full" title={asset.originalFilename}>
          {asset.originalFilename}
        </p>
        <p className="text-[10px] text-zinc-500 mt-0.5">
          {asset.mimeType} · {sizeKb} KB
        </p>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative block w-full rounded-lg overflow-hidden border border-zinc-200 bg-zinc-100 hover:border-zinc-400 hover:shadow-md transition-all"
      title={asset.originalFilename}
      style={{ aspectRatio: "1 / 1" }}
    >
      {isImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={asset.storageUrl}
          alt={asset.originalFilename}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
          onError={() => setBroken(true)}
        />
      ) : (
        <>
          <video
            src={asset.storageUrl}
            className="absolute inset-0 w-full h-full object-cover"
            muted
            playsInline
            preload="metadata"
            onError={() => setBroken(true)}
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm">
              <Film className="h-4 w-4 text-white" />
            </div>
          </div>
        </>
      )}
      <div className="absolute bottom-1 left-1 right-1 flex items-center justify-between text-[10px] opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <span className="px-1.5 py-0.5 rounded bg-black/60 text-white font-mono">
          {asset.sortOrder + 1}
        </span>
        <span className="px-1.5 py-0.5 rounded bg-black/60 text-white font-mono">
          {sizeKb} KB
        </span>
      </div>
    </button>
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
      <dt className="w-36 text-zinc-600 shrink-0">{label}</dt>
      <dd className="text-zinc-900 font-medium">{children}</dd>
    </div>
  );
}
