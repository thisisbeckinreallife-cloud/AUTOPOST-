"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDateInTz, formatTimeInTz } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Film,
  Image as ImageIcon,
  Layers,
  X,
  Calendar as CalendarIcon,
  Check,
  Trash2,
} from "lucide-react";

export interface CalendarPost {
  id: string;
  postType: "IMAGE" | "CAROUSEL" | "REEL" | string;
  caption: string;
  publishAt: Date | string;
  status: string;
  /** Batch al que pertenece el post. Necesario para activar via /api/batches/[id]/confirm. */
  batchId: string;
  firstMedia: { storageUrl: string; mimeType: string } | null;
  mediaCount: number;
}

const MONTH_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const DAY_ES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const RESCHEDULABLE = new Set(["DRAFT", "VALIDATED", "READY", "SCHEDULED"]);

function parseMonth(m: string | undefined): { year: number; month: number } {
  if (m && /^\d{4}-\d{2}$/.test(m)) {
    const [y, mo] = m.split("-").map(Number);
    return { year: y, month: mo - 1 };
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

function fmtMonth(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

function statusColor(status: string): string {
  if (status === "PUBLISHED") return "bg-success";
  if (status === "FAILED" || status === "CANCELLED") return "bg-error";
  if (status === "PUBLISHING") return "bg-warning";
  if (status === "VALIDATED" || status === "READY" || status === "DRAFT") return "bg-ink-20";
  return "bg-info"; // SCHEDULED
}

function typeIcon(postType: string) {
  if (postType === "REEL") return <Film className="h-2.5 w-2.5" />;
  if (postType === "CAROUSEL") return <Layers className="h-2.5 w-2.5" />;
  return <ImageIcon className="h-2.5 w-2.5" />;
}

/** Formato YYYY-MM-DDTHH:MM para <input type="datetime-local">. */
function toLocalDatetimeInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

export function CalendarView({
  posts: initialPosts,
  slug,
  timezone,
  monthParam,
  preservedQuery,
}: {
  posts: CalendarPost[];
  slug: string;
  timezone: string;
  monthParam: string | undefined;
  preservedQuery: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Estado local — permite update optimista antes de que el servidor confirme.
  // Las fechas llegan como Date desde el RSC, pero se serializan a string en
  // el cruce; las normalizamos siempre a Date local.
  const [posts, setPosts] = useState<CalendarPost[]>(() =>
    initialPosts.map((p) => ({ ...p, publishAt: new Date(p.publishAt) })),
  );
  const [editing, setEditing] = useState<CalendarPost | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverDay, setDragOverDay] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [activating, setActivating] = useState(false);
  const [activateResult, setActivateResult] = useState<{ scheduled: number; failed: number } | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);

  // Sincronizar si llega nueva data desde server (e.g. tras router.refresh()).
  useEffect(() => {
    setPosts(initialPosts.map((p) => ({ ...p, publishAt: new Date(p.publishAt) })));
  }, [initialPosts]);

  const { year, month } = parseMonth(monthParam);
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const firstWeekday = (firstDay.getDay() + 6) % 7;
  const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;

  const postsByDay = useMemo(() => {
    const map = new Map<number, CalendarPost[]>();
    for (const p of posts) {
      const d = p.publishAt as Date;
      if (d.getFullYear() !== year || d.getMonth() !== month) continue;
      const day = d.getDate();
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(p);
    }
    // Ordenar dentro del día por hora
    for (const list of map.values()) {
      list.sort((a, b) => (a.publishAt as Date).getTime() - (b.publishAt as Date).getTime());
    }
    return map;
  }, [posts, year, month]);

  const prevMonth = month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 };
  const nextMonth = month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 };

  const today = new Date();
  const isSameMonth = today.getFullYear() === year && today.getMonth() === month;
  const todayDay = isSameMonth ? today.getDate() : -1;

  function urlFor(y: number, m: number): string {
    const params = new URLSearchParams(preservedQuery);
    params.set("view", "calendar");
    params.set("month", fmtMonth(y, m));
    return `/businesses/${slug}/posts?${params.toString()}`;
  }

  // Posts en estado VALIDATED/READY (= borradores listos pero no programados).
  // Estos son los que el botón "Activar" pasa a SCHEDULED + encola.
  const validatedPosts = useMemo(
    () => posts.filter((p) => p.status === "VALIDATED" || p.status === "READY"),
    [posts],
  );
  const validatedBatchIds = useMemo(
    () => Array.from(new Set(validatedPosts.map((p) => p.batchId))),
    [validatedPosts],
  );

  // Cancelables = todo lo que está en cola pero aún no publicado.
  // Si el user trae captions mal o quiere empezar de cero, esto barre la mesa.
  const cancellablePosts = useMemo(
    () =>
      posts.filter((p) =>
        ["DRAFT", "VALIDATED", "READY", "SCHEDULED"].includes(p.status),
      ),
    [posts],
  );

  async function cancelAll() {
    if (cancelling || cancellablePosts.length === 0) return;
    setCancelling(true);
    setError(null);
    setCancelConfirm(false);

    try {
      const ids = cancellablePosts.map((p) => p.id);
      const res = await fetch("/api/posts/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", ids }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);

      // Optimistic: marca todos como CANCELLED localmente
      setPosts((curr) =>
        curr.map((p) =>
          ids.includes(p.id) ? { ...p, status: "CANCELLED" } : p,
        ),
      );
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cancelando");
    } finally {
      setCancelling(false);
    }
  }

  async function activateAll() {
    if (activating || validatedBatchIds.length === 0) return;
    setActivating(true);
    setError(null);
    setActivateResult(null);

    let totalScheduled = 0;
    let totalFailed = 0;
    const errors: string[] = [];

    // Confirmar cada batch en serie. /api/batches/[id]/confirm reusa la
    // misma lógica que el botón "Activar" del detalle del batch.
    for (const batchId of validatedBatchIds) {
      try {
        const res = await fetch(`/api/batches/${batchId}/confirm`, { method: "POST" });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          errors.push(json.error ?? `Batch ${batchId.slice(0, 8)}: HTTP ${res.status}`);
          continue;
        }
        const data = json.data ?? json;
        totalScheduled += data.scheduled ?? 0;
        totalFailed += data.failed ?? 0;
      } catch (err) {
        errors.push(err instanceof Error ? err.message : "Error de red");
      }
    }

    setActivating(false);
    setActivateResult({ scheduled: totalScheduled, failed: totalFailed });
    if (errors.length > 0) setError(errors.join(" · "));

    // Refrescar para que los posts pasen visualmente a SCHEDULED.
    startTransition(() => router.refresh());
    setTimeout(() => setActivateResult(null), 5000);
  }

  async function reschedule(post: CalendarPost, newDate: Date) {
    if (!RESCHEDULABLE.has(post.status)) {
      setError(`No se puede reagendar un post en estado ${post.status}.`);
      return;
    }
    setPending(true);
    setError(null);

    // Update optimista
    const prevPublishAt = post.publishAt as Date;
    setPosts((curr) =>
      curr.map((p) => (p.id === post.id ? { ...p, publishAt: newDate } : p)),
    );

    try {
      const res = await fetch("/api/posts/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reschedule",
          ids: [post.id],
          publishAt: newDate.toISOString(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
      startTransition(() => router.refresh());
    } catch (err) {
      // Rollback
      setPosts((curr) =>
        curr.map((p) => (p.id === post.id ? { ...p, publishAt: prevPublishAt } : p)),
      );
      setError(err instanceof Error ? err.message : "Error reagendando");
    } finally {
      setPending(false);
    }
  }

  function onDragStart(e: React.DragEvent, post: CalendarPost) {
    if (!RESCHEDULABLE.has(post.status)) {
      e.preventDefault();
      return;
    }
    setDragId(post.id);
    e.dataTransfer.effectAllowed = "move";
    // En Firefox hace falta setData para que el drag funcione
    e.dataTransfer.setData("text/plain", post.id);
  }

  function onDragEnd() {
    setDragId(null);
    setDragOverDay(null);
  }

  function onDayDragOver(e: React.DragEvent, day: number) {
    if (!dragId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverDay !== day) setDragOverDay(day);
  }

  function onDayDrop(e: React.DragEvent, day: number) {
    e.preventDefault();
    const id = dragId ?? e.dataTransfer.getData("text/plain");
    if (!id) return;
    const post = posts.find((p) => p.id === id);
    if (!post) return;
    const oldDate = post.publishAt as Date;
    const newDate = new Date(oldDate);
    newDate.setFullYear(year, month, day);
    // Mantener la hora original al arrastrar entre días
    setDragId(null);
    setDragOverDay(null);
    if (newDate.getTime() === oldDate.getTime()) return; // sin cambio
    void reschedule(post, newDate);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Link
            href={urlFor(prevMonth.year, prevMonth.month)}
            className="p-1.5 rounded-lg border border-ink-4 bg-ink-2 hover:bg-ink-2 text-ink-8 transition-colors"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <h2 className="text-base font-semibold text-ink-9 min-w-[140px] text-center tabular-nums">
            {MONTH_ES[month]} {year}
          </h2>
          <Link
            href={urlFor(nextMonth.year, nextMonth.month)}
            className="p-1.5 rounded-lg border border-ink-4 bg-ink-2 hover:bg-ink-2 text-ink-8 transition-colors"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <p className="text-xs text-ink-6 flex-1 min-w-[200px]">
          Arrastra un post a otro día · clic para cambiar fecha y hora exacta
        </p>
        {savedFlash && (
          <span className="inline-flex items-center gap-1 text-xs text-success font-medium">
            <Check className="h-3 w-3" /> Guardado
          </span>
        )}
        {cancellablePosts.length > 0 && (
          <button
            type="button"
            onClick={() => setCancelConfirm(true)}
            disabled={cancelling || activating}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-md border border-red-300 text-error font-medium text-sm hover:bg-error-soft disabled:opacity-50 transition-all"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            {cancelling
              ? "Cancelando…"
              : `Cancelar ${cancellablePosts.length} ${cancellablePosts.length === 1 ? "post" : "posts"}`}
          </button>
        )}
        {validatedPosts.length > 0 && (
          <button
            type="button"
            onClick={activateAll}
            disabled={activating || cancelling}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-success text-white font-medium text-sm shadow-md hover:bg-success disabled:opacity-50 transition-all"
          >
            <Check className="h-4 w-4" aria-hidden="true" />
            {activating
              ? "Activando…"
              : `Activar ${validatedPosts.length} ${validatedPosts.length === 1 ? "post" : "posts"}`}
          </button>
        )}
      </div>

      {cancelConfirm && (
        <div
          role="alertdialog"
          aria-labelledby="cancel-confirm-title"
          className="rounded-xl bg-error-soft border border-error/30 px-4 py-3 flex items-center justify-between flex-wrap gap-3"
        >
          <div className="flex items-center gap-2 text-sm text-error">
            <Trash2 className="h-4 w-4" />
            <span id="cancel-confirm-title">
              ¿Cancelar {cancellablePosts.length} {cancellablePosts.length === 1 ? "post" : "posts"}?
              Se quitarán del calendario y no se publicarán.
            </span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCancelConfirm(false)}
              className="inline-flex items-center h-9 px-3 rounded-md border border-ink-4 text-ink-9 font-medium text-sm hover:bg-ink-3"
            >
              No
            </button>
            <button
              type="button"
              onClick={cancelAll}
              className="inline-flex items-center h-9 px-3 rounded-md bg-red-700 text-white font-medium text-sm hover:bg-red-800"
            >
              Sí, cancelar todos
            </button>
          </div>
        </div>
      )}

      {activateResult && (
        <div
          role="status"
          className="rounded-xl bg-success-soft border border-success/30 px-4 py-3 text-sm text-success flex items-center gap-2 animate-fade-in"
        >
          <Check className="h-4 w-4" />
          {activateResult.scheduled} publicaciones programadas correctamente
          {activateResult.failed > 0 && ` · ${activateResult.failed} fallaron`}
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-xl bg-error-soft border border-error/30 px-3 py-2 text-xs text-error">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-ink-4 bg-ink-2 overflow-hidden">
        <div className="grid grid-cols-7 bg-ink-2 border-b border-ink-3">
          {DAY_ES.map((d) => (
            <div key={d} className="px-2 py-2 text-[10px] font-bold text-ink-7 uppercase tracking-widest text-center">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 auto-rows-[120px]">
          {Array.from({ length: totalCells }).map((_, i) => {
            const dayNum = i - firstWeekday + 1;
            const inMonth = dayNum >= 1 && dayNum <= daysInMonth;
            const dayPosts = inMonth ? postsByDay.get(dayNum) ?? [] : [];
            const isToday = dayNum === todayDay;
            const isDragOver = dragOverDay === dayNum && dragId !== null;
            return (
              <div
                key={i}
                onDragOver={inMonth ? (e) => onDayDragOver(e, dayNum) : undefined}
                onDrop={inMonth ? (e) => onDayDrop(e, dayNum) : undefined}
                onDragLeave={() => setDragOverDay((d) => (d === dayNum ? null : d))}
                className={`border-r border-b border-ink-3 last:border-r-0 p-1.5 overflow-hidden transition-colors ${
                  !inMonth
                    ? "bg-ink-2"
                    : isDragOver
                      ? "bg-accent-soft ring-2 ring-accent ring-inset"
                      : isToday
                        ? "bg-accent-soft"
                        : ""
                }`}
              >
                {inMonth && (
                  <>
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-[11px] font-semibold tabular-nums ${
                          isToday
                            ? "bg-accent text-white px-1.5 py-0.5 rounded-full"
                            : "text-ink-8"
                        }`}
                      >
                        {dayNum}
                      </span>
                      {dayPosts.length > 2 && (
                        <span className="text-[9px] font-bold text-ink-6 font-mono">
                          {dayPosts.length}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      {dayPosts.slice(0, 2).map((post) => {
                        const canDrag = RESCHEDULABLE.has(post.status);
                        return (
                          <button
                            key={post.id}
                            type="button"
                            draggable={canDrag}
                            onDragStart={(e) => onDragStart(e, post)}
                            onDragEnd={onDragEnd}
                            onClick={() => canDrag && setEditing(post)}
                            disabled={pending}
                            title={
                              canDrag
                                ? `${post.caption.slice(0, 80)}${post.caption.length > 80 ? "…" : ""}\n\nClic para editar fecha/hora · arrastra para mover de día`
                                : `${post.status} — no editable`
                            }
                            className={`group w-full flex items-center gap-1.5 rounded-md bg-ink-2 hover:bg-ink-3 border border-ink-4 px-1 py-0.5 transition-colors overflow-hidden text-left ${
                              dragId === post.id ? "opacity-30" : ""
                            } ${!canDrag ? "cursor-not-allowed opacity-70" : "cursor-grab active:cursor-grabbing"}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${statusColor(post.status)}`} />
                            {post.firstMedia?.mimeType.startsWith("image/") && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={post.firstMedia.storageUrl}
                                alt=""
                                className="h-4 w-4 shrink-0 rounded object-cover"
                                loading="lazy"
                                draggable={false}
                              />
                            )}
                            {post.firstMedia?.mimeType.startsWith("video/") && (
                              <div className="h-4 w-4 shrink-0 rounded bg-ink-4 flex items-center justify-center">
                                <Film className="h-2 w-2 text-ink-7" />
                              </div>
                            )}
                            {!post.firstMedia && (
                              <span className="text-ink-6">{typeIcon(post.postType)}</span>
                            )}
                            <span className="text-[10px] text-ink-8 truncate flex-1 tabular-nums">
                              {formatTimeInTz(post.publishAt as Date, timezone)}
                            </span>
                          </button>
                        );
                      })}
                      {dayPosts.length > 2 && (
                        <Link
                          href={`/businesses/${slug}/posts?view=list&date=${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`}
                          className="block text-[10px] text-ink-6 hover:text-ink-9 px-1 font-medium"
                        >
                          +{dayPosts.length - 2} más
                        </Link>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-[11px] text-ink-7">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-ink-20" /> Borrador / Validado
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-info" /> Programado
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-warning" /> Publicando
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-success" /> Publicado
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-error" /> Fallido / Cancelado
        </span>
      </div>

      {editing && (
        <EditPostModal
          post={editing}
          slug={slug}
          timezone={timezone}
          onClose={() => setEditing(null)}
          onSave={async (newDate) => {
            await reschedule(editing, newDate);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function EditPostModal({
  post,
  slug,
  timezone,
  onClose,
  onSave,
}: {
  post: CalendarPost;
  slug: string;
  timezone: string;
  onClose: () => void;
  onSave: (newDate: Date) => Promise<void>;
}) {
  const initial = post.publishAt as Date;
  const [value, setValue] = useState<string>(toLocalDatetimeInput(initial));
  const [saving, setSaving] = useState(false);

  // Esc cierra
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    const newDate = new Date(value);
    if (isNaN(newDate.getTime())) return;
    setSaving(true);
    try {
      await onSave(newDate);
    } finally {
      setSaving(false);
    }
  }

  const previewLabel = (() => {
    const d = new Date(value);
    return isNaN(d.getTime()) ? "—" : formatDateInTz(d, timezone);
  })();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-title"
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
    >
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 bg-ink-0/80 backdrop-blur-sm"
      />
      <form
        onSubmit={handleSave}
        className="relative z-10 w-full max-w-md bg-ink-2 border border-ink-4 rounded-xl shadow-2xl p-6"
      >
        <div className="flex items-start justify-between mb-4 gap-4">
          <div>
            <h3 id="edit-title" className="text-lg font-semibold text-ink-9 tracking-tight">
              Reagendar publicación
            </h3>
            <p className="text-xs text-ink-6 mt-1">
              {post.postType} · {post.mediaCount} archivo{post.mediaCount === 1 ? "" : "s"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="h-8 w-8 inline-flex items-center justify-center rounded-md text-ink-6 hover:text-ink-9 hover:bg-ink-3"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {post.caption && (
          <p className="text-sm text-ink-8 bg-ink-2 border border-ink-4 rounded-md px-3 py-2 mb-4 line-clamp-3">
            {post.caption}
          </p>
        )}

        <label htmlFor="publish-at" className="block text-sm font-medium text-ink-9 mb-2">
          <CalendarIcon className="h-4 w-4 inline mr-1.5 -mt-0.5" />
          Fecha y hora de publicación
        </label>
        <input
          id="publish-at"
          type="datetime-local"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full h-11 px-3 rounded-md border border-ink-4 bg-ink-2 text-sm text-ink-9 focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent"
          required
        />
        <p className="text-xs text-ink-6 mt-2">
          Vista previa: <span className="font-medium text-ink-8">{previewLabel}</span>
        </p>

        <div className="flex gap-2 justify-end mt-6">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center h-10 px-4 rounded-md border border-ink-4 text-ink-9 font-medium text-sm hover:bg-ink-2"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center h-10 px-4 rounded-md bg-accent text-white font-medium text-sm hover:bg-accent disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Guardar fecha"}
          </button>
        </div>

        <p className="text-[11px] text-ink-6 mt-4">
          <Link href={`/businesses/${slug}/posts/${post.id}`} className="underline hover:text-ink-9">
            Ver detalle del post →
          </Link>
        </p>
      </form>
    </div>
  );
}
