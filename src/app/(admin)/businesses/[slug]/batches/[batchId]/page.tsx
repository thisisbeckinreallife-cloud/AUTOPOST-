"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Image,
  Film,
  Layers,
  Pencil,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  Calendar,
} from "lucide-react";
import type { ParseError } from "@/types";

// ─── Types ──────────────────────────────────────────────────────

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
  mediaAssets: {
    id: string;
    originalFilename: string;
    mimeType: string;
    sortOrder: number;
    storageUrl: string;
  }[];
}

// ─── Helpers ────────────────────────────────────────────────────

function friendlyError(msg: string): string {
  if (msg.includes("caption") || msg.includes("Caption"))
    return "Falta el texto del post (caption.txt)";
  if (msg.includes("meta.json") || msg.includes("meta"))
    return "Falta el archivo de configuracion (meta.json)";
  if (msg.includes("media") || msg.includes("image") || msg.includes("video"))
    return "Falta la imagen o video del post";
  if (msg.includes("date") || msg.includes("fecha") || msg.includes("publishAt"))
    return "La fecha de publicacion no es valida";
  if (msg.includes("duplicate") || msg.includes("duplicado"))
    return "Hay un post duplicado con la misma fecha";
  return msg;
}

function formatDateTimeLocal(isoStr: string): string {
  const d = new Date(isoStr);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDateEs(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const postTypeIcon = (type: string) => {
  switch (type) {
    case "REEL":
      return <Film className="h-5 w-5 text-purple-500" />;
    case "CAROUSEL":
      return <Layers className="h-5 w-5 text-blue-500" />;
    default:
      return <Image className="h-5 w-5 text-green-500" />;
  }
};

const postTypeLabel = (type: string) => {
  switch (type) {
    case "REEL":
      return "Reel";
    case "CAROUSEL":
      return "Carrusel";
    default:
      return "Imagen";
  }
};

// ─── Post card with inline editing ──────────────────────────────

function PostCard({
  post,
  onSave,
}: {
  post: PostDraftPreview;
  onSave: (id: string, data: { caption?: string; publishAt?: string }) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [caption, setCaption] = useState(post.caption);
  const [publishAt, setPublishAt] = useState(
    formatDateTimeLocal(post.publishAt)
  );
  const [saving, setSaving] = useState(false);

  const isEditable = ["DRAFT", "VALIDATED", "READY"].includes(post.status);
  const hasNoCaption = !post.caption || post.caption.trim().length === 0;

  async function handleSave() {
    setSaving(true);
    try {
      const updates: { caption?: string; publishAt?: string } = {};
      if (caption !== post.caption) updates.caption = caption;
      if (publishAt !== formatDateTimeLocal(post.publishAt)) {
        updates.publishAt = new Date(publishAt).toISOString();
      }
      if (Object.keys(updates).length > 0) {
        await onSave(post.id, updates);
      }
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden transition-all">
      {/* Main row */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Thumbnail */}
        <div className="shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
          {post.mediaAssets[0]?.storageUrl &&
          post.mediaAssets[0].mimeType.startsWith("image/") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.mediaAssets[0].storageUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            postTypeIcon(post.postType)
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
              {postTypeLabel(post.postType)}
            </span>
            {post.mediaAssets.length > 1 && (
              <span className="text-xs text-slate-400">
                {post.mediaAssets.length} archivos
              </span>
            )}
            {hasNoCaption && isEditable && (
              <span className="text-xs text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded">
                Sin texto
              </span>
            )}
          </div>
          <p className="text-sm text-slate-700 truncate mt-0.5">
            {post.caption || (
              <span className="text-slate-400 italic">Sin descripcion</span>
            )}
          </p>
        </div>

        {/* Date + status */}
        <div className="text-right shrink-0">
          <p className="text-xs text-slate-500">{formatDateEs(post.publishAt)}</p>
          <PostStatusPill status={post.status} />
        </div>

        <div className="shrink-0 text-slate-300">
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-slate-100 px-4 py-4 space-y-4 bg-slate-50/50">
          {/* Media preview */}
          {post.mediaAssets.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {post.mediaAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-slate-100 border border-slate-200"
                >
                  {asset.mimeType.startsWith("image/") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={asset.storageUrl}
                      alt={asset.originalFilename}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Film className="h-6 w-6 text-slate-300" />
                      <span className="text-xs text-slate-400 ml-1">Video</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Editable fields */}
          {editing ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">
                  Descripcion del post
                </label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={4}
                  maxLength={2200}
                  placeholder="Escribe el texto de tu publicacion..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
                />
                <p className="text-xs text-slate-400 text-right mt-0.5">
                  {caption.length}/2200
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">
                  Fecha y hora de publicacion
                </label>
                <input
                  type="datetime-local"
                  value={publishAt}
                  onChange={(e) => setPublishAt(e.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave} loading={saving}>
                  <Save className="h-3.5 w-3.5 mr-1" />
                  Guardar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditing(false);
                    setCaption(post.caption);
                    setPublishAt(formatDateTimeLocal(post.publishAt));
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div>
                <p className="text-xs font-medium text-slate-400 mb-1">
                  Descripcion
                </p>
                <p className="text-sm text-slate-700 whitespace-pre-line">
                  {post.caption || (
                    <span className="text-slate-400 italic">
                      Sin descripcion — edita para agregar texto
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <p className="text-sm text-slate-600">
                  {formatDateEs(post.publishAt)}
                </p>
              </div>
              {isEditable && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditing(true);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5 mr-1" />
                  Editar
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────────

export default function BatchDetailPage() {
  const { slug, batchId } = useParams() as { slug: string; batchId: string };
  const [batch, setBatch] = useState<BatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [confirmResult, setConfirmResult] = useState<{
    scheduled: number;
    failed: number;
  } | null>(null);
  const [error, setError] = useState("");
  const [saveError, setSaveError] = useState("");

  const fetchBatch = useCallback(async () => {
    try {
      const res = await fetch(`/api/batches/${batchId}`);
      if (res.ok) {
        const data = await res.json();
        setBatch(data.data);
      }
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    fetchBatch();
    const interval = setInterval(() => {
      if (batch?.status === "PARSING" || batch?.status === "UPLOADED")
        fetchBatch();
    }, 3000);
    return () => clearInterval(interval);
  }, [batchId, batch?.status, fetchBatch]);

  async function handleSavePost(
    postId: string,
    data: { caption?: string; publishAt?: string }
  ) {
    setSaveError("");
    const res = await fetch(`/api/posts/${postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      setSaveError(err.error ?? "No se pudo guardar");
      throw new Error(err.error);
    }
    // Refresh the batch to reflect changes
    await fetchBatch();
  }

  async function handleConfirm() {
    setConfirming(true);
    setError("");
    try {
      const res = await fetch(`/api/batches/${batchId}/confirm`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo programar. Intentalo de nuevo.");
        return;
      }
      setConfirmResult(data.data);
      await fetchBatch();
    } catch {
      setError("Error de red. Comprueba tu conexion.");
    } finally {
      setConfirming(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
        Cargando...
      </div>
    );
  }
  if (!batch) {
    return <div className="text-slate-500">No se encontro este contenido.</div>;
  }

  const canConfirm = ["PARSED", "VALIDATION_FAILED"].includes(batch.status);
  const hasErrors = (batch.parseErrors?.length ?? 0) > 0;
  const hasWarnings = (batch.parseWarnings?.length ?? 0) > 0;
  const isParsing = batch.status === "PARSING" || batch.status === "UPLOADED";
  const editablePosts = batch.postDrafts.filter((p) =>
    ["DRAFT", "VALIDATED", "READY"].includes(p.status)
  );

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 truncate">
          Revisa tu contenido
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">
          {batch.business.name} · {batch.originalFilename}
        </p>
      </div>

      {/* Processing indicator */}
      {isParsing && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-4">
          <Clock className="h-5 w-5 text-blue-500 animate-pulse shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-800">
              Analizando tu contenido...
            </p>
            <p className="text-xs text-blue-600">
              Esto puede tardar unos segundos. La pagina se actualizara
              automaticamente.
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      {batch.totalPosts !== null && !isParsing && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-slate-900">
              {batch.totalPosts}
            </p>
            <p className="text-xs text-slate-400 mt-1">Posts encontrados</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-green-700">
              {batch.validPosts ?? 0}
            </p>
            <p className="text-xs text-slate-400 mt-1">Listos</p>
          </div>
          <div
            className={`border rounded-xl p-4 text-center ${
              (batch.failedPosts ?? 0) > 0
                ? "bg-red-50 border-red-200"
                : "bg-white border-slate-200"
            }`}
          >
            <p
              className={`text-3xl font-bold ${
                (batch.failedPosts ?? 0) > 0 ? "text-red-600" : "text-slate-900"
              }`}
            >
              {batch.failedPosts ?? 0}
            </p>
            <p className="text-xs text-slate-400 mt-1">Con problemas</p>
          </div>
        </div>
      )}

      {/* Edit hint */}
      {editablePosts.length > 0 && !isParsing && !confirmResult && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <Pencil className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-800">
              Puedes editar antes de activar
            </p>
            <p className="text-xs text-blue-600">
              Toca cada post para cambiar el texto, la fecha o la hora de
              publicacion. Cuando estes listo, pulsa "Activar".
            </p>
          </div>
        </div>
      )}

      {/* Confirm */}
      {canConfirm && (batch.validPosts ?? 0) > 0 && !confirmResult && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-slate-800">
              Todo listo? Activa las publicaciones
            </p>
            <p className="text-sm text-slate-500 mt-0.5">
              {batch.validPosts} posts seran programados
            </p>
          </div>
          <Button onClick={handleConfirm} loading={confirming} className="shrink-0">
            Activar {batch.validPosts} posts
          </Button>
        </div>
      )}

      {confirmResult && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          {confirmResult.scheduled} publicaciones programadas correctamente
          {confirmResult.failed > 0 && ` · ${confirmResult.failed} fallaron`}
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {saveError && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {saveError}
        </div>
      )}

      {/* Errors */}
      {hasErrors && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
          <p className="font-semibold text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Hay {batch.parseErrors!.length} problema
            {batch.parseErrors!.length !== 1 ? "s" : ""}
          </p>
          <div className="space-y-2">
            {batch.parseErrors!.map((e, i) => (
              <div
                key={i}
                className="flex items-start gap-2 bg-white rounded-lg px-3 py-2 border border-red-100"
              >
                <span className="text-red-400 mt-0.5 shrink-0">-</span>
                <div>
                  <p className="text-xs font-mono text-slate-400">{e.folder}</p>
                  <p className="text-sm text-slate-700">
                    {friendlyError(e.message)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {hasWarnings && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
          <p className="font-semibold text-amber-700 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {batch.parseWarnings!.length} aviso
            {batch.parseWarnings!.length !== 1 ? "s" : ""}
          </p>
          {batch.parseWarnings!.map((w, i) => (
            <div key={i} className="text-sm flex items-start gap-2">
              <span className="text-amber-400 shrink-0">-</span>
              <span className="text-slate-600">
                {friendlyError(w.message)}{" "}
                <span className="text-xs text-slate-400">({w.folder})</span>
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Posts list */}
      {batch.postDrafts.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-slate-900 mb-3">
            Tus posts ({batch.postDrafts.length})
          </h2>
          <div className="space-y-2">
            {batch.postDrafts.map((post) => (
              <PostCard key={post.id} post={post} onSave={handleSavePost} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PostStatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    SCHEDULED: { label: "Programado", cls: "bg-blue-100 text-blue-700" },
    PUBLISHED: { label: "Publicado", cls: "bg-green-100 text-green-700" },
    FAILED: { label: "Error", cls: "bg-red-100 text-red-700" },
    DRAFT: { label: "Borrador", cls: "bg-slate-100 text-slate-600" },
    VALIDATED: { label: "Revisado", cls: "bg-slate-100 text-slate-600" },
    READY: { label: "Listo", cls: "bg-green-100 text-green-700" },
    CANCELLED: { label: "Cancelado", cls: "bg-slate-100 text-slate-400" },
  };
  const s = map[status] ?? { label: status, cls: "bg-slate-100 text-slate-600" };
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${s.cls}`}
    >
      {s.label}
    </span>
  );
}
