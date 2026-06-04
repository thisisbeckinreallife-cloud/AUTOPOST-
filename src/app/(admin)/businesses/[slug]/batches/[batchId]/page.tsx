"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDateInTz } from "@/lib/utils";
import { AlertTriangle, CheckCircle, Clock, Image, Film, Layers, ChevronRight, LayoutGrid, List } from "lucide-react";
import type { ParseError } from "@/types";
import { BatchDetailSkeleton } from "@/components/ui/skeleton";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { useToast } from "@/components/ui/toast";
import { FeedPreview } from "@/components/upload/feed-preview";

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
  approvalStatus: string;
  sourceFolderName: string;
  validationErrors: unknown[] | null;
  mediaAssets: { id: string; originalFilename: string; mimeType: string; sortOrder: number }[];
}

function friendlyError(msg: string): string {
  if (msg.includes("caption") || msg.includes("Caption")) return "Falta el texto del post (caption.txt)";
  if (msg.includes("meta.json") || msg.includes("meta")) return "Falta el archivo de configuracion (meta.json)";
  if (msg.includes("media") || msg.includes("image") || msg.includes("video")) return "Falta la imagen o video del post";
  if (msg.includes("date") || msg.includes("fecha") || msg.includes("publishAt")) return "La fecha de publicacion no es valida";
  if (msg.includes("duplicate") || msg.includes("duplicado")) return "Hay un post duplicado con la misma fecha";
  return msg;
}

export default function BatchDetailPage() {
  const { slug, batchId } = useParams() as { slug: string; batchId: string };
  const [batch, setBatch] = useState<BatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [confirmResult, setConfirmResult] = useState<{ scheduled: number; failed: number } | null>(null);
  const [error, setError] = useState("");
  const [view, setView] = useState<"list" | "grid">("list");
  const { toast } = useToast();

  async function fetchBatch() {
    try {
      const res = await fetch(`/api/batches/${batchId}`);
      if (res.ok) { const data = await res.json(); setBatch(data.data); }
    } finally { setLoading(false); }
  }

  useEffect(() => {
    fetchBatch();
    const interval = setInterval(() => {
      if (batch?.status === "PARSING" || batch?.status === "UPLOADED") fetchBatch();
    }, 3000);
    return () => clearInterval(interval);
  }, [batchId, batch?.status]);

  async function handleConfirm() {
    setConfirming(true);
    setError("");
    try {
      const res = await fetch(`/api/batches/${batchId}/confirm`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "No se pudo programar. Intentalo de nuevo."); toast(data.error ?? "No se pudo programar", "error"); return; }
      setConfirmResult(data.data);
      toast(`${data.data.scheduled} publicaciones programadas`, "success");
      await fetchBatch();
    } catch {
      setError("Error de red. Comprueba tu conexion.");
    } finally { setConfirming(false); }
  }

  if (loading) {
    return <BatchDetailSkeleton />;
  }
  if (!batch) {
    return <div className="text-ink-6">No se encontro este contenido.</div>;
  }

  const canConfirm = ["PARSED", "VALIDATION_FAILED"].includes(batch.status);
  const hasErrors = (batch.parseErrors?.length ?? 0) > 0;
  const hasWarnings = (batch.parseWarnings?.length ?? 0) > 0;
  const isParsing = batch.status === "PARSING" || batch.status === "UPLOADED";

  return (
    <div className="space-y-5 max-w-2xl">
      <Breadcrumb items={[
        { label: "Inicio", href: "/dashboard" },
        { label: batch.business.name, href: `/businesses/${slug}` },
        { label: "Subidas", href: `/businesses/${slug}/batches` },
        { label: batch.originalFilename },
      ]} />

      <div>
        <h1 className="font-display text-xl font-bold text-ink-9 truncate">{batch.originalFilename}</h1>
        <p className="text-ink-6 text-sm mt-0.5">{batch.business.name}</p>
      </div>

      {/* Processing */}
      {isParsing && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3.5">
          <Clock className="h-5 w-5 text-blue-700 animate-pulse-subtle shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-900">Analizando tu contenido...</p>
            <p className="text-xs text-blue-700/60">La pagina se actualizara automaticamente.</p>
          </div>
        </div>
      )}

      {/* Stats */}
      {batch.totalPosts !== null && !isParsing && (
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4 text-center">
            <p className="text-2xl font-display font-bold text-ink-9 tabular-nums">{batch.totalPosts}</p>
            <p className="text-xs text-ink-6 mt-1">Encontrados</p>
          </Card>
          <Card className="p-4 text-center border-success/30">
            <p className="text-2xl font-display font-bold text-success tabular-nums">{batch.validPosts ?? 0}</p>
            <p className="text-xs text-ink-6 mt-1">Listos</p>
          </Card>
          <Card className={`p-4 text-center ${(batch.failedPosts ?? 0) > 0 ? "border-red-500/10" : ""}`}>
            <p className={`text-2xl font-display font-bold tabular-nums ${(batch.failedPosts ?? 0) > 0 ? "text-error" : "text-ink-9"}`}>{batch.failedPosts ?? 0}</p>
            <p className="text-xs text-ink-6 mt-1">Con problemas</p>
          </Card>
        </div>
      )}

      {/* Confirm */}
      {canConfirm && (batch.validPosts ?? 0) > 0 && !confirmResult && (
        <Card className="p-5 border-success/30 bg-success-soft">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-ink-9">Todo listo? Activa las publicaciones</p>
              <p className="text-sm text-ink-6 mt-0.5">{batch.validPosts} posts seran programados</p>
            </div>
            <Button onClick={handleConfirm} loading={confirming} className="shrink-0">
              Activar {batch.validPosts} posts
            </Button>
          </div>
        </Card>
      )}

      {confirmResult && (
        <div className="bg-success-soft border border-success/30 rounded-xl px-4 py-3 text-sm text-success flex items-center gap-2 animate-fade-in">
          <CheckCircle className="h-4 w-4" />
          {confirmResult.scheduled} publicaciones programadas correctamente
          {confirmResult.failed > 0 && ` · ${confirmResult.failed} fallaron`}
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-error-soft border border-error/30 px-4 py-3 text-sm text-error">{error}</div>
      )}

      {/* Errors */}
      {hasErrors && (
        <div className="bg-error-soft border border-error/30 rounded-xl p-4 space-y-3">
          <p className="font-semibold text-error flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4" />
            {batch.parseErrors!.length} problema{batch.parseErrors!.length !== 1 ? "s" : ""} que debes corregir
          </p>
          <div className="space-y-1.5">
            {batch.parseErrors!.map((e, i) => (
              <div key={i} className="flex items-start gap-2 bg-ink-2 rounded-lg px-3 py-2 border border-error/30">
                <span className="text-error mt-0.5 shrink-0 text-xs">•</span>
                <div>
                  <p className="text-[11px] font-mono text-ink-6">{e.folder}</p>
                  <p className="text-sm text-ink-9">{friendlyError(e.message)}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-error/60">Corrige estos problemas y vuelve a subir el ZIP</p>
        </div>
      )}

      {/* Warnings */}
      {hasWarnings && (
        <div className="bg-warning-soft border border-warning/30 rounded-xl p-4 space-y-2">
          <p className="font-semibold text-warning flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4" />
            {batch.parseWarnings!.length} aviso{batch.parseWarnings!.length !== 1 ? "s" : ""}
          </p>
          {batch.parseWarnings!.map((w, i) => (
            <div key={i} className="text-sm flex items-start gap-2">
              <span className="text-warning/60 shrink-0">•</span>
              <span className="text-ink-6">{friendlyError(w.message)} <span className="text-xs text-ink-6">({w.folder})</span></span>
            </div>
          ))}
        </div>
      )}

      {/* Posts */}
      {batch.postDrafts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-ink-9">
              Tus posts ({batch.postDrafts.length})
            </h2>
            <div className="flex items-center gap-1 bg-ink-2 border border-ink-4 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setView("list")}
                className={`p-1.5 rounded-md transition-colors ${view === "list" ? "bg-ink-3 text-ink-9" : "text-ink-6 hover:text-ink-6"}`}
                title="Vista lista"
              >
                <List className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setView("grid")}
                className={`p-1.5 rounded-md transition-colors ${view === "grid" ? "bg-ink-3 text-ink-9" : "text-ink-6 hover:text-ink-6"}`}
                title="Vista del feed"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {view === "grid" && (
            <FeedPreview
              posts={batch.postDrafts.map((p) => ({
                id: p.id,
                imageUrl: p.mediaAssets.length > 0
                  ? `/api/media/${[...p.mediaAssets].sort((a, b) => a.sortOrder - b.sortOrder)[0].id}`
                  : "",
                caption: p.caption,
                publishAt: p.publishAt,
                postType: p.postType,
              }))}
            />
          )}

          {view === "list" && (
          <div className="space-y-1.5">
            {batch.postDrafts.map((post) => (
              <a
                key={post.id}
                href={`/businesses/${slug}/posts/${post.id}`}
                className="flex items-center gap-3 bg-ink-2 border border-ink-4 rounded-lg px-4 py-3 hover:border-ink-4 transition-all"
              >
                <div className="shrink-0">
                  {post.postType === "REEL" ? <Film className="h-4 w-4 text-purple-700" />
                    : post.postType === "CAROUSEL" ? <Layers className="h-4 w-4 text-blue-700" />
                    : <Image className="h-4 w-4 text-success" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-9 truncate">{post.sourceFolderName}</p>
                  <p className="text-xs text-ink-6 truncate">{post.caption.slice(0, 80)}{post.caption.length > 80 ? "..." : ""}</p>
                </div>
                <div className="text-xs text-ink-6 shrink-0 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDateInTz(post.publishAt, batch.business.timezone)}
                </div>
                <PostStatusPill status={post.status} />
                <ApprovalPill approvalStatus={post.approvalStatus} postId={post.id} onUpdate={fetchBatch} />
                <ChevronRight className="h-4 w-4 text-ink-6 shrink-0" />
              </a>
            ))}
          </div>
          )}
        </div>
      )}
    </div>
  );
}

function PostStatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    SCHEDULED:  { label: "Programado",  cls: "bg-info/10 text-blue-700" },
    PUBLISHED:  { label: "Publicado",   cls: "bg-green-500/10 text-success" },
    FAILED:     { label: "Error",       cls: "bg-error-soft text-error" },
    DRAFT:      { label: "Borrador",    cls: "bg-ink-3 text-ink-6" },
    VALIDATED:  { label: "Revisado",    cls: "bg-ink-3 text-ink-6" },
    READY:      { label: "Listo",       cls: "bg-green-500/10 text-success" },
    CANCELLED:  { label: "Cancelado",   cls: "bg-ink-3 text-ink-6" },
  };
  const s = map[status] ?? { label: status, cls: "bg-ink-3 text-ink-6" };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${s.cls}`}>{s.label}</span>;
}

function ApprovalPill({
  approvalStatus,
  postId,
  onUpdate,
}: {
  approvalStatus: string;
  postId: string;
  onUpdate: () => void;
}) {
  const [loading, setLoading] = useState(false);

  async function act(action: "approve" | "reject") {
    setLoading(true);
    try {
      await fetch(`/api/posts/${postId}/${action}`, { method: "POST" });
      onUpdate();
    } finally {
      setLoading(false);
    }
  }

  if (approvalStatus === "APPROVED") {
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-ink-3 text-ink-9 font-medium shrink-0 border border-ink-4">
        Aprobado
      </span>
    );
  }
  if (approvalStatus === "REJECTED") {
    return (
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); act("approve"); }}
        disabled={loading}
        className="text-[10px] px-2 py-0.5 rounded-full bg-error-soft text-error font-medium shrink-0 border border-red-500/10 hover:bg-ink-3 hover:text-ink-9 hover:border-ink-4 transition-colors"
        title="Rechazado — clic para aprobar"
      >
        Rechazado
      </button>
    );
  }
  // PENDING_APPROVAL
  return (
    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.preventDefault()}>
      <button
        type="button"
        onClick={() => act("approve")}
        disabled={loading}
        className="text-[10px] px-2 py-0.5 rounded-full bg-warning-soft0/10 text-warning border border-amber-500/10 hover:bg-ink-3 hover:text-ink-9 hover:border-ink-4 font-medium transition-colors"
        title="Aprobar"
      >
        ✓ Aprobar
      </button>
    </div>
  );
}
