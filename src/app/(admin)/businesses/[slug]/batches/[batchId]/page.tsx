"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDateInTz } from "@/lib/utils";
import { AlertTriangle, CheckCircle, Clock, Image, Film, Layers, ChevronRight } from "lucide-react";
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
      if (!res.ok) { setError(data.error ?? "No se pudo programar. Intentalo de nuevo."); return; }
      setConfirmResult(data.data);
      await fetchBatch();
    } catch {
      setError("Error de red. Comprueba tu conexion.");
    } finally { setConfirming(false); }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-48 text-slate-500 text-sm">Cargando...</div>;
  }
  if (!batch) {
    return <div className="text-slate-500">No se encontro este contenido.</div>;
  }

  const canConfirm = ["PARSED", "VALIDATION_FAILED"].includes(batch.status);
  const hasErrors = (batch.parseErrors?.length ?? 0) > 0;
  const hasWarnings = (batch.parseWarnings?.length ?? 0) > 0;
  const isParsing = batch.status === "PARSING" || batch.status === "UPLOADED";

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 truncate">{batch.originalFilename}</h1>
        <p className="text-slate-500 text-sm mt-0.5">{batch.business.name}</p>
      </div>

      {/* Processing indicator */}
      {isParsing && (
        <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-4">
          <Clock className="h-5 w-5 text-blue-400 animate-pulse shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-300">Analizando tu contenido...</p>
            <p className="text-xs text-blue-400/70">Esto puede tardar unos segundos. La pagina se actualizara automaticamente.</p>
          </div>
        </div>
      )}

      {/* Stats */}
      {batch.totalPosts !== null && !isParsing && (
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4 text-center">
            <p className="text-3xl font-bold text-slate-100">{batch.totalPosts}</p>
            <p className="text-xs text-slate-500 mt-1">Posts encontrados</p>
          </Card>
          <Card className="p-4 text-center border-green-500/20">
            <p className="text-3xl font-bold text-green-400">{batch.validPosts ?? 0}</p>
            <p className="text-xs text-slate-500 mt-1">Listos para publicar</p>
          </Card>
          <Card className={`p-4 text-center ${(batch.failedPosts ?? 0) > 0 ? "border-red-500/20" : ""}`}>
            <p className={`text-3xl font-bold ${(batch.failedPosts ?? 0) > 0 ? "text-red-400" : "text-slate-100"}`}>{batch.failedPosts ?? 0}</p>
            <p className="text-xs text-slate-500 mt-1">Con problemas</p>
          </Card>
        </div>
      )}

      {/* Confirm */}
      {canConfirm && (batch.validPosts ?? 0) > 0 && !confirmResult && (
        <Card className="p-5 border-green-500/20 bg-green-500/5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-slate-200">Todo listo? Activa las publicaciones</p>
              <p className="text-sm text-slate-500 mt-0.5">{batch.validPosts} posts seran programados automaticamente</p>
            </div>
            <Button onClick={handleConfirm} loading={confirming} className="shrink-0">
              Activar {batch.validPosts} posts
            </Button>
          </div>
        </Card>
      )}

      {confirmResult && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 text-sm text-green-400 flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          {confirmResult.scheduled} publicaciones programadas correctamente
          {confirmResult.failed > 0 && ` · ${confirmResult.failed} fallaron`}
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      {/* Errors */}
      {hasErrors && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 space-y-3">
          <p className="font-semibold text-red-400 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Hay {batch.parseErrors!.length} problema{batch.parseErrors!.length !== 1 ? "s" : ""} que debes corregir
          </p>
          <div className="space-y-2">
            {batch.parseErrors!.map((e, i) => (
              <div key={i} className="flex items-start gap-2 bg-surface-primary rounded-lg px-3 py-2 border border-red-500/10">
                <span className="text-red-400 mt-0.5 shrink-0">•</span>
                <div>
                  <p className="text-xs font-mono text-slate-500">{e.folder}</p>
                  <p className="text-sm text-slate-300">{friendlyError(e.message)}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-red-400/70">Corrige estos problemas en tu carpeta y vuelve a subir el ZIP</p>
        </div>
      )}

      {/* Warnings */}
      {hasWarnings && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 space-y-2">
          <p className="font-semibold text-amber-400 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {batch.parseWarnings!.length} aviso{batch.parseWarnings!.length !== 1 ? "s" : ""} (no son errores)
          </p>
          {batch.parseWarnings!.map((w, i) => (
            <div key={i} className="text-sm flex items-start gap-2">
              <span className="text-amber-400 shrink-0">•</span>
              <span className="text-slate-400">{friendlyError(w.message)} <span className="text-xs text-slate-500">({w.folder})</span></span>
            </div>
          ))}
        </div>
      )}

      {/* Posts list */}
      {batch.postDrafts.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-slate-200 mb-3">
            Tus posts ({batch.postDrafts.length})
          </h2>
          <div className="space-y-2">
            {batch.postDrafts.map((post) => (
              <a
                key={post.id}
                href={`/businesses/${slug}/posts/${post.id}`}
                className="flex items-center gap-3 bg-surface-card border border-slate-800 rounded-lg px-4 py-3 hover:border-slate-700 hover:bg-surface-hover transition-all"
              >
                <div className="shrink-0">
                  {post.postType === "REEL" ? <Film className="h-5 w-5 text-purple-400" />
                    : post.postType === "CAROUSEL" ? <Layers className="h-5 w-5 text-blue-400" />
                    : <Image className="h-5 w-5 text-green-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{post.sourceFolderName}</p>
                  <p className="text-xs text-slate-500 truncate">{post.caption.slice(0, 80)}{post.caption.length > 80 ? "..." : ""}</p>
                </div>
                <div className="text-xs text-slate-500 shrink-0 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDateInTz(post.publishAt, batch.business.timezone)}
                </div>
                <PostStatusPill status={post.status} />
                <ChevronRight className="h-4 w-4 text-slate-600 shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PostStatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    SCHEDULED:  { label: "Programado",  cls: "bg-blue-500/20 text-blue-400" },
    PUBLISHED:  { label: "Publicado",   cls: "bg-green-500/20 text-green-400" },
    FAILED:     { label: "Error",       cls: "bg-red-500/20 text-red-400" },
    DRAFT:      { label: "Borrador",    cls: "bg-slate-500/20 text-slate-400" },
    VALIDATED:  { label: "Revisado",    cls: "bg-slate-500/20 text-slate-400" },
    READY:      { label: "Listo",       cls: "bg-green-500/20 text-green-400" },
    CANCELLED:  { label: "Cancelado",   cls: "bg-slate-500/20 text-slate-500" },
  };
  const s = map[status] ?? { label: status, cls: "bg-slate-500/20 text-slate-400" };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${s.cls}`}>{s.label}</span>;
}
