"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/ui/badge";
import { formatDateInTz } from "@/lib/utils";
import {
  Image as ImageIcon, Film, Layers, Clock,
  CheckSquare, Square, X as XIcon, Calendar as CalendarIcon, XCircle,
  Undo2, CheckCircle2,
} from "lucide-react";

export interface PostItem {
  id: string;
  postType: "IMAGE" | "CAROUSEL" | "REEL" | string;
  sourceFolderName: string;
  caption: string;
  publishAt: string; // ISO
  status: string;
  mediaCount: number;
  firstMedia: { storageUrl: string; mimeType: string } | null;
}

const CANCELLABLE = new Set(["DRAFT", "VALIDATED", "READY", "SCHEDULED"]);

const POST_TYPE_ICON = (t: string) => {
  if (t === "IMAGE") return <ImageIcon className="h-3.5 w-3.5 text-success" />;
  if (t === "CAROUSEL") return <Layers className="h-3.5 w-3.5 text-blue-700" />;
  if (t === "REEL") return <Film className="h-3.5 w-3.5 text-purple-700" />;
  return null;
};

const POST_TYPE_BG: Record<string, string> = {
  IMAGE: "bg-success-soft",
  CAROUSEL: "bg-blue-100",
  REEL: "bg-purple-100",
};

export function PostsListClient({
  posts,
  slug,
  timezone,
}: {
  posts: PostItem[];
  slug: string;
  timezone: string;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [action, setAction] = useState<null | "cancel" | "reschedule_relative" | "reschedule">(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offsetHours, setOffsetHours] = useState<number>(24);
  const [publishAt, setPublishAt] = useState<string>("");
  const [toast, setToast] = useState<null | {
    message: string;
    kind: "success" | "info";
    undo?: { ids: string[]; offsetHours: number };
  }>(null);
  const [undoing, setUndoing] = useState(false);

  // Auto-dismiss toast after 8s
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 8000);
    return () => clearTimeout(t);
  }, [toast]);

  const cancellableIds = useMemo(
    () => new Set(posts.filter((p) => CANCELLABLE.has(p.status)).map((p) => p.id)),
    [posts]
  );

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllVisible() {
    const allVisibleActionable = posts.filter((p) => cancellableIds.has(p.id)).map((p) => p.id);
    const everyoneSelected = allVisibleActionable.every((id) => selected.has(id));
    setSelected(() => {
      if (everyoneSelected) return new Set();
      return new Set(allVisibleActionable);
    });
  }

  function clearSelection() {
    setSelected(new Set());
    setAction(null);
    setError(null);
  }

  async function executeAction() {
    if (!action || selected.size === 0) return;
    setPending(true);
    setError(null);
    const ids = Array.from(selected);
    let body: unknown;
    if (action === "cancel") {
      body = { action: "cancel", ids };
    } else if (action === "reschedule_relative") {
      body = { action: "reschedule_relative", ids, offsetHours };
    } else {
      if (!publishAt) {
        setError("Elige una fecha y hora");
        setPending(false);
        return;
      }
      body = { action: "reschedule", ids, publishAt: new Date(publishAt).toISOString() };
    }

    try {
      const res = await fetch("/api/posts/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al aplicar la acción");
        return;
      }

      // Show toast with undo if applicable
      const updated = data.updated ?? ids.length;
      const skipped = data.skipped ?? 0;
      if (action === "cancel") {
        setToast({
          message: `${updated} ${updated === 1 ? "post cancelado" : "posts cancelados"}${skipped > 0 ? ` · ${skipped} omitidos` : ""}`,
          kind: "info",
        });
      } else if (action === "reschedule_relative") {
        setToast({
          message: `${updated} ${updated === 1 ? "post desplazado" : "posts desplazados"} ${offsetHours > 0 ? "+" : ""}${offsetHours}h`,
          kind: "success",
          undo: { ids, offsetHours: -offsetHours },
        });
      } else {
        setToast({
          message: `${updated} ${updated === 1 ? "post reprogramado" : "posts reprogramados"}`,
          kind: "success",
        });
      }

      setSelected(new Set());
      setAction(null);
      router.refresh();
    } catch {
      setError("Error de red");
    } finally {
      setPending(false);
    }
  }

  async function executeUndo() {
    if (!toast?.undo) return;
    setUndoing(true);
    try {
      const res = await fetch("/api/posts/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reschedule_relative",
          ids: toast.undo.ids,
          offsetHours: toast.undo.offsetHours,
        }),
      });
      if (res.ok) {
        setToast({ message: "Cambio deshecho", kind: "info" });
        router.refresh();
      } else {
        setToast({ message: "No se pudo deshacer", kind: "info" });
      }
    } finally {
      setUndoing(false);
    }
  }

  const visibleActionableCount = posts.filter((p) => cancellableIds.has(p.id)).length;
  const allSelected = visibleActionableCount > 0 && posts
    .filter((p) => cancellableIds.has(p.id))
    .every((p) => selected.has(p.id));

  return (
    <>
      {posts.length === 0 ? null : (
        <>
          {/* Select-all row */}
          <div className="flex items-center justify-between px-1">
            <button
              type="button"
              onClick={toggleAllVisible}
              className="inline-flex items-center gap-2 text-xs font-medium text-ink-7 hover:text-ink-9 transition-colors"
              disabled={visibleActionableCount === 0}
            >
              {allSelected ? (
                <CheckSquare className="h-4 w-4 text-ink-9" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              {allSelected
                ? "Deseleccionar todos"
                : `Seleccionar todos (${visibleActionableCount} posibles)`}
            </button>
            {selected.size > 0 && (
              <button
                type="button"
                onClick={clearSelection}
                className="text-xs text-ink-7 hover:text-ink-9 inline-flex items-center gap-1"
              >
                Limpiar
                <XIcon className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="space-y-2">
            {posts.map((post) => {
              const isSel = selected.has(post.id);
              const canSelect = cancellableIds.has(post.id);
              return (
                <div
                  key={post.id}
                  className={`group block rounded-xl border bg-ink-2 px-3.5 py-3 transition-all ${
                    isSel
                      ? "border-ink-5 ring-2 ring-accent/20 shadow-sm"
                      : "border-ink-4 hover:border-ink-4 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Checkbox */}
                    <button
                      type="button"
                      onClick={() => toggle(post.id)}
                      disabled={!canSelect}
                      aria-label={isSel ? "Deseleccionar post" : "Seleccionar post"}
                      className={`shrink-0 flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                        !canSelect
                          ? "border-ink-4 bg-ink-2 opacity-40 cursor-not-allowed"
                          : isSel
                          ? "border-ink-5 bg-ink-3 text-white"
                          : "border-ink-4 bg-ink-2 hover:border-ink-5"
                      }`}
                      title={canSelect ? undefined : `No seleccionable en estado ${post.status}`}
                    >
                      {isSel && <CheckSquare className="h-3.5 w-3.5" strokeWidth={3} />}
                    </button>

                    <Link
                      href={`/businesses/${slug}/posts/${post.id}`}
                      className="flex-1 flex items-center gap-3.5 min-w-0"
                    >
                      {/* Thumbnail */}
                      <div className="relative h-14 w-14 shrink-0 rounded-lg overflow-hidden border border-ink-4 bg-ink-3">
                        {post.firstMedia?.mimeType.startsWith("image/") && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={post.firstMedia.storageUrl}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover"
                            loading="lazy"
                          />
                        )}
                        {post.firstMedia?.mimeType.startsWith("video/") && (
                          <>
                            <video
                              src={post.firstMedia.storageUrl}
                              className="absolute inset-0 w-full h-full object-cover"
                              muted
                              playsInline
                              preload="metadata"
                            />
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm">
                                <Film className="h-2.5 w-2.5 text-white" />
                              </div>
                            </div>
                          </>
                        )}
                        {!post.firstMedia && (
                          <div className={`absolute inset-0 flex items-center justify-center ${POST_TYPE_BG[post.postType] ?? "bg-ink-3"}`}>
                            {POST_TYPE_ICON(post.postType)}
                          </div>
                        )}
                        {post.mediaCount > 1 && (
                          <div className="absolute top-0.5 right-0.5 px-1 rounded bg-black/60 text-white text-[9px] font-bold font-mono">
                            +{post.mediaCount - 1}
                          </div>
                        )}
                      </div>

                      {/* Main */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold font-mono ${POST_TYPE_BG[post.postType] ?? "bg-ink-3"} text-ink-8`}>
                            {POST_TYPE_ICON(post.postType)}
                            {post.postType}
                          </span>
                          <p className="text-xs text-ink-6 truncate font-mono">
                            {post.sourceFolderName}
                          </p>
                        </div>
                        <p className="text-sm text-ink-9 truncate leading-snug">
                          {post.caption.slice(0, 90)}
                          {post.caption.length > 90 ? "…" : ""}
                        </p>
                        <p className="text-xs text-ink-6 mt-0.5 tabular-nums flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDateInTz(new Date(post.publishAt), timezone)}
                        </p>
                      </div>

                      {/* Status */}
                      <div className="shrink-0">
                        <StatusBadge status={post.status} />
                      </div>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Toast notification */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
          role="status"
          aria-live="polite"
        >
          <div
            className={`flex items-center gap-3 rounded-xl px-4 py-3 shadow-xl border ${
              toast.kind === "success"
                ? "bg-success border-success/40 text-white"
                : "bg-ink-3 border-ink-4 text-white"
            }`}
          >
            {toast.kind === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            ) : (
              <CheckSquare className="h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            <span className="text-sm font-semibold flex-1">{toast.message}</span>
            {toast.undo && (
              <button
                type="button"
                onClick={executeUndo}
                disabled={undoing}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-ink-2/15 hover:bg-ink-2/25 text-xs font-bold disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                aria-label="Deshacer la acción"
              >
                <Undo2 className="h-3 w-3" />
                {undoing ? "..." : "Deshacer"}
              </button>
            )}
            <button
              type="button"
              onClick={() => setToast(null)}
              className="p-1 rounded hover:bg-ink-2/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              aria-label="Cerrar notificación"
            >
              <XIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Sticky bulk action toolbar */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-lg px-4">
          <div className="rounded-2xl bg-ink-3 text-white shadow-xl border border-ink-4 overflow-hidden">
            {/* Top: selection summary + actions */}
            <div className="flex items-center gap-2 px-4 py-3">
              <span className="text-sm font-semibold flex-1">
                {selected.size} {selected.size === 1 ? "seleccionado" : "seleccionados"}
              </span>
              <button
                type="button"
                onClick={() => { setAction("reschedule_relative"); setError(null); }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  action === "reschedule_relative" || action === "reschedule"
                    ? "bg-ink-2 text-ink-9"
                    : "bg-ink-3 hover:bg-ink-4 text-white"
                }`}
              >
                <CalendarIcon className="h-3.5 w-3.5" />
                Reprogramar
              </button>
              <button
                type="button"
                onClick={() => { setAction("cancel"); setError(null); }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  action === "cancel"
                    ? "bg-error text-white"
                    : "bg-ink-3 hover:bg-error/90 hover:text-white text-ink-8"
                }`}
              >
                <XCircle className="h-3.5 w-3.5" />
                Cancelar
              </button>
              <button
                type="button"
                onClick={clearSelection}
                className="p-1.5 rounded-lg hover:bg-ink-3 text-ink-6 hover:text-white"
                aria-label="Cerrar"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>

            {/* Detail panel */}
            {action === "cancel" && (
              <div className="px-4 pb-3 border-t border-ink-4 pt-3 flex items-center gap-3">
                <p className="text-xs text-ink-7 flex-1">
                  Cancelar {selected.size} post{selected.size !== 1 ? "s" : ""}. Los que estén PUBLISHING o PUBLISHED se ignorarán.
                </p>
                <button
                  type="button"
                  onClick={executeAction}
                  disabled={pending}
                  className="px-3 py-1.5 rounded-lg bg-error hover:bg-red-600 text-white text-xs font-bold disabled:opacity-50"
                >
                  {pending ? "…" : "Confirmar"}
                </button>
              </div>
            )}
            {(action === "reschedule_relative" || action === "reschedule") && (
              <div className="px-4 pb-3 border-t border-ink-4 pt-3 space-y-2">
                <div className="flex gap-1 bg-ink-3 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => setAction("reschedule_relative")}
                    className={`flex-1 px-2 py-1 rounded-md text-[11px] font-semibold ${action === "reschedule_relative" ? "bg-ink-2 text-ink-9" : "text-ink-7 hover:text-white"}`}
                  >
                    Desplazar horas
                  </button>
                  <button
                    type="button"
                    onClick={() => setAction("reschedule")}
                    className={`flex-1 px-2 py-1 rounded-md text-[11px] font-semibold ${action === "reschedule" ? "bg-ink-2 text-ink-9" : "text-ink-7 hover:text-white"}`}
                  >
                    Nueva fecha
                  </button>
                </div>
                {action === "reschedule_relative" ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={offsetHours}
                      onChange={(e) => setOffsetHours(parseInt(e.target.value || "0", 10))}
                      className="w-20 bg-ink-3 border border-ink-4 rounded-md px-2 py-1.5 text-sm text-white focus:outline-none focus:border-accent"
                      aria-label="Horas a desplazar"
                    />
                    <p className="text-xs text-ink-7 flex-1">
                      horas ({offsetHours >= 0 ? "adelantar" : "retrasar"}) todos los seleccionados
                    </p>
                    <button
                      type="button"
                      onClick={executeAction}
                      disabled={pending || offsetHours === 0}
                      className="px-3 py-1.5 rounded-lg bg-ink-2 text-ink-9 text-xs font-bold disabled:opacity-50"
                    >
                      {pending ? "…" : "Aplicar"}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="datetime-local"
                      value={publishAt}
                      onChange={(e) => setPublishAt(e.target.value)}
                      className="flex-1 bg-ink-3 border border-ink-4 rounded-md px-2 py-1.5 text-sm text-white focus:outline-none focus:border-accent"
                    />
                    <button
                      type="button"
                      onClick={executeAction}
                      disabled={pending || !publishAt}
                      className="px-3 py-1.5 rounded-lg bg-ink-2 text-ink-9 text-xs font-bold disabled:opacity-50"
                    >
                      {pending ? "…" : "Aplicar"}
                    </button>
                  </div>
                )}
              </div>
            )}
            {error && (
              <div className="px-4 pb-3 text-xs text-red-300">
                {error}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
