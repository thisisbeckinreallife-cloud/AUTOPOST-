import Link from "next/link";
import { formatDateInTz } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Film, Image as ImageIcon, Layers } from "lucide-react";

export interface CalendarPost {
  id: string;
  postType: "IMAGE" | "CAROUSEL" | "REEL" | string;
  caption: string;
  publishAt: Date;
  status: string;
  firstMedia: { storageUrl: string; mimeType: string } | null;
  mediaCount: number;
}

const MONTH_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const DAY_ES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

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
  if (status === "PUBLISHED") return "bg-emerald-500";
  if (status === "FAILED" || status === "CANCELLED") return "bg-red-500";
  if (status === "PUBLISHING") return "bg-amber-500";
  return "bg-blue-500";
}

function typeIcon(postType: string) {
  if (postType === "REEL") return <Film className="h-2.5 w-2.5" />;
  if (postType === "CAROUSEL") return <Layers className="h-2.5 w-2.5" />;
  return <ImageIcon className="h-2.5 w-2.5" />;
}

export function CalendarView({
  posts,
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
  const { year, month } = parseMonth(monthParam);
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  // Monday=0 ... Sunday=6
  const firstWeekday = (firstDay.getDay() + 6) % 7;
  const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;

  // Filter posts in visible month
  const postsByDay = new Map<number, CalendarPost[]>();
  posts.forEach((p) => {
    if (p.publishAt.getFullYear() !== year || p.publishAt.getMonth() !== month) return;
    const day = p.publishAt.getDate();
    if (!postsByDay.has(day)) postsByDay.set(day, []);
    postsByDay.get(day)!.push(p);
  });

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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href={urlFor(prevMonth.year, prevMonth.month)}
            className="p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 transition-colors"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <h2 className="font-display text-lg font-bold text-zinc-900 tabular-nums min-w-[180px]">
            {MONTH_ES[month]} {year}
          </h2>
          <Link
            href={urlFor(nextMonth.year, nextMonth.month)}
            className="p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 transition-colors"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        {!isSameMonth && (
          <Link
            href={urlFor(today.getFullYear(), today.getMonth())}
            className="px-3 py-1.5 rounded-md text-xs font-semibold bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
          >
            Hoy
          </Link>
        )}
      </div>

      {/* Grid */}
      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        <div className="grid grid-cols-7 border-b border-zinc-200 bg-zinc-50">
          {DAY_ES.map((d) => (
            <div key={d} className="px-2 py-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest text-center">
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
            return (
              <div
                key={i}
                className={`border-r border-b border-zinc-100 last:border-r-0 p-1.5 overflow-hidden ${
                  !inMonth ? "bg-zinc-50" : isToday ? "bg-cyan-50" : ""
                }`}
              >
                {inMonth && (
                  <>
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-[11px] font-semibold tabular-nums ${
                          isToday
                            ? "bg-cyan-700 text-white px-1.5 py-0.5 rounded-full"
                            : "text-zinc-700"
                        }`}
                      >
                        {dayNum}
                      </span>
                      {dayPosts.length > 2 && (
                        <span className="text-[9px] font-bold text-zinc-400 font-mono">
                          {dayPosts.length}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      {dayPosts.slice(0, 2).map((post) => (
                        <Link
                          key={post.id}
                          href={`/businesses/${slug}/posts/${post.id}`}
                          className="group flex items-center gap-1.5 rounded-md bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 px-1 py-0.5 transition-colors overflow-hidden"
                          title={`${post.caption.slice(0, 80)}${post.caption.length > 80 ? "…" : ""}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${statusColor(post.status)}`} />
                          {post.firstMedia?.mimeType.startsWith("image/") && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={post.firstMedia.storageUrl}
                              alt=""
                              className="h-4 w-4 shrink-0 rounded object-cover"
                              loading="lazy"
                            />
                          )}
                          {post.firstMedia?.mimeType.startsWith("video/") && (
                            <div className="h-4 w-4 shrink-0 rounded bg-zinc-700 flex items-center justify-center">
                              <Film className="h-2 w-2 text-white" />
                            </div>
                          )}
                          {!post.firstMedia && (
                            <span className="text-zinc-500">{typeIcon(post.postType)}</span>
                          )}
                          <span className="text-[10px] text-zinc-700 truncate flex-1 tabular-nums">
                            {formatDateInTz(post.publishAt, timezone).split(" ").slice(-2).join(" ")}
                          </span>
                        </Link>
                      ))}
                      {dayPosts.length > 2 && (
                        <Link
                          href={`/businesses/${slug}/posts?view=list&date=${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`}
                          className="block text-[10px] text-zinc-500 hover:text-zinc-900 px-1 font-medium"
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
      <div className="flex flex-wrap items-center gap-4 text-[11px] text-zinc-600">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" /> Programado
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Publicando
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Publicado
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Fallido / Cancelado
        </span>
      </div>
    </div>
  );
}
