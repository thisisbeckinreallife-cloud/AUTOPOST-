"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/ui/badge";
import { formatDateInTz } from "@/lib/utils";
import {
  Image as ImageIcon, Film, Layers, Clock,
  CheckSquare, Square, X as XIcon, Calendar as CalendarIcon, XCircle,
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
  if (t === "IMAGE") return <ImageIcon className="h-3.5 w-3.5 text-emerald-700" />;
  if (t === "CAROUSEL") return <Layers className="h-3.5 w-3.5 text-blue-700" />;
  if (t === "REEL") return <Film className="h-3.5 w-3.5 text-purple-700" />;
  return null;
};

const POST_TYPE_BG: Record<string, string> = {
  IMAGE: "bg-emerald-100",
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
      // reschedule (absolute)
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
      setSelected(new Set());
      setAction(null);
      router.refresh();
    } catch {
      setError("Error de red");
    } finally {
      setPending(false);
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
              className="inline-flex items-center gap-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
              disabled={visibleActionableCount === 0}
            >
              {allSelected ? (
                <CheckSquare className="h-4 w-4 text-zinc-900" />
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
                className="text-xs text-zinc-600 hover:text-zinc-900 inline-flex items-center gap-1"
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
                  className={`group block rounded-xl border bg-white px-3.5 py-3 transition-all ${
                    isSel
                      ? "border-zinc-900 ring-2 ring-zinc-900/10 shadow-sm"
                      : "border-zinc-200 hover:border-zinc-300 hover:shadow-sm"
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
                          ? "border-zinc-200 bg-zinc-50 opacity-40 cursor-not-allowed"
                          : isSel
                          ? "border-zinc-900 bg-zinc-900 text-white"
                          : "border-zinc-300 bg-white hover:border-zinc-500"
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
                      <div className="relative h-14 w-14 shrink-0 rounded-lg overflow-hidden border border-zinc-200 bg-zinc-100">
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
                          <div className={`absolute inset-0 flex items-center justify-center ${POST_TYPE_BG[post.postType] ?? "bg-zinc-100"}`}>
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
                          <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold font-mono ${POST_TYPE_BG[post.postType] ?? "bg-zinc-100"} text-zinc-700`}>
                            {POST_TYPE_ICON(post.postType)}
                            {post.postType}
                          </span>
                          <p className="text-xs text-zinc-500 truncate font-mono">
                            {post.sourceFolderName}
                          </p>
                        </div>
                        <p className="text-sm text-zinc-900 truncate leading-snug">
                          {post.caption.slice(0, 90)}
                          {post.caption.length > 90 ? "…" : ""}
                        </p>
                        <p className="text-xs text-zinc-500 mt-0.5 tabular-nums flex items-center gap-1">
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

      {/* Sticky bulk action toolbar */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-lg px-4">
          <div className="rounded-2xl bg-zinc-900 text-white shadow-xl border border-zinc-800 overflow-hidden">
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
                    ? "bg-white text-zinc-900"
                    : "bg-zinc-800 hover:bg-zinc-700 text-white"
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
                    ? "bg-red-500 text-white"
                    : "bg-zinc-800 hover:bg-red-500/90 hover:text-white text-zinc-200"
                }`}
              >
                <XCircle className="h-3.5 w-3.5" />
                Cancelar
              </button>
              <button
                type="button"
                onClick={clearSelection}
                className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white"
                aria-label="Cerrar"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>

            {/* Detail panel */}
            {action === "cancel" && (
              <div className="px-4 pb-3 border-t border-zinc-800 pt-3 flex items-center gap-3">
                <p className="text-xs text-zinc-300 flex-1">
                  Cancelar {selected.size} post{selected.size !== 1 ? "s" : ""}. Los que estén PUBLISHING o PUBLISHED se ignorarán.
                </p>
                <button
                  type="button"
                  onClick={executeAction}
                  disabled={pending}
                  className="px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-bold disabled:opacity-50"
                >
                  {pending ? "…" : "Confirmar"}
                </button>
              </div>
            )}
            {(action === "reschedule_relative" || action === "reschedule") && (
              <div className="px-4 pb-3 border-t border-zinc-800 pt-3 space-y-2">
                <div className="flex gap-1 bg-zinc-800 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => setAction("reschedule_relative")}
                    className={`flex-1 px-2 py-1 rounded-md text-[11px] font-semibold ${action === "reschedule_relative" ? "bg-white text-zinc-900" : "text-zinc-300 hover:text-white"}`}
                  >
                    Desplazar horas
                  </button>
                  <button
                    type="button"
                    onClick={() => setAction("reschedule")}
                    className={`flex-1 px-2 py-1 rounded-md text-[11px] font-semibold ${action === "reschedule" ? "bg-white text-zinc-900" : "text-zinc-300 hover:text-white"}`}
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
                      className="w-20 bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1.5 text-sm text-white focus:outline-none focus:border-zinc-500"
                      aria-label="Horas a desplazar"
                    />
                    <p className="text-xs text-zinc-300 flex-1">
                      horas ({offsetHours >= 0 ? "adelantar" : "retrasar"}) todos los seleccionados
                    </p>
                    <button
                      type="button"
                      onClick={executeAction}
                      disabled={pending || offsetHours === 0}
                      className="px-3 py-1.5 rounded-lg bg-white text-zinc-900 text-xs font-bold disabled:opacity-50"
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
                      className="flex-1 bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1.5 text-sm text-white focus:outline-none focus:border-zinc-500"
                    />
                    <button
                      type="button"
                      onClick={executeAction}
                      disabled={pending || !publishAt}
                      className="px-3 py-1.5 rounded-lg bg-white text-zinc-900 text-xs font-bold disabled:opacity-50"
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
