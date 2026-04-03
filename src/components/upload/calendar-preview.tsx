"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Image, Film, Layers } from "lucide-react";
import type { DetectedPost } from "./post-analyzer";

interface CalendarPreviewProps {
  posts: DetectedPost[];
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Convert to Monday-first
}

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const DAY_HEADERS = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];

export function CalendarPreview({ posts }: CalendarPreviewProps) {
  // Find the month range from posts
  const postsWithDates = posts.filter((p) => p.publishAt);
  const firstDate = postsWithDates.length > 0
    ? new Date(Math.min(...postsWithDates.map((p) => p.publishAt!.getTime())))
    : new Date();

  const [currentMonth, setCurrentMonth] = useState(firstDate.getMonth());
  const [currentYear, setCurrentYear] = useState(firstDate.getFullYear());

  // Group posts by date
  const postsByDate = useMemo(() => {
    const map = new Map<string, DetectedPost[]>();
    for (const post of postsWithDates) {
      const d = post.publishAt!;
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(post);
    }
    return map;
  }, [posts]);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfWeek(currentYear, currentMonth);
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

  function prevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  }

  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  }

  // Calculate total posts this month
  const postsThisMonth = Array.from(postsByDate.entries())
    .filter(([key]) => {
      const parts = key.split("-").map(Number);
      return parts[0] === currentYear && parts[1] === currentMonth;
    })
    .reduce((sum, [, p]) => sum + p.length, 0);

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-indigo-500/10 to-blue-500/10 border border-indigo-500/20 rounded-2xl p-5">
        <p className="font-semibold text-slate-100">Vista previa del calendario</p>
        <p className="text-sm text-slate-400 mt-1">
          Asi quedaran distribuidos tus {posts.length} posts.
        </p>
      </div>

      <div className="bg-surface-card border border-slate-800 rounded-xl overflow-hidden">
        {/* Month header */}
        <div className="flex items-center justify-between px-4 py-3 bg-surface-primary border-b border-slate-800">
          <button
            onClick={prevMonth}
            className="p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-slate-400" />
          </button>
          <div className="text-center">
            <h3 className="font-semibold text-slate-100">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </h3>
            <p className="text-xs text-slate-400">
              {postsThisMonth} post{postsThisMonth !== 1 ? "s" : ""} este mes
            </p>
          </div>
          <button
            onClick={nextMonth}
            className="p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <ChevronRight className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-slate-800">
          {DAY_HEADERS.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-slate-400 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {/* Empty cells for offset */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="h-20 border-b border-r border-slate-800" />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const key = `${currentYear}-${currentMonth}-${day}`;
            const dayPosts = postsByDate.get(key) ?? [];
            const isToday = key === todayKey;
            const isPast =
              new Date(currentYear, currentMonth, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

            return (
              <div
                key={day}
                className={`h-20 border-b border-r border-slate-800 p-1 transition-colors ${
                  isToday ? "bg-blue-500/10" : isPast ? "bg-surface-primary/50" : ""
                }`}
              >
                <span
                  className={`text-xs font-medium ${
                    isToday
                      ? "bg-brand-500 text-white w-5 h-5 rounded-full flex items-center justify-center"
                      : isPast
                        ? "text-slate-200"
                        : "text-slate-400"
                  }`}
                >
                  {day}
                </span>

                {/* Post indicators */}
                <div className="mt-0.5 space-y-0.5">
                  {dayPosts.slice(0, 2).map((post, pi) => (
                    <div
                      key={pi}
                      className={`flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] leading-tight truncate ${
                        post.status === "complete"
                          ? "bg-green-500/20 text-green-400"
                          : post.status === "incomplete"
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {post.postType === "reel" ? (
                        <Film className="h-2.5 w-2.5 shrink-0" />
                      ) : post.postType === "carousel" ? (
                        <Layers className="h-2.5 w-2.5 shrink-0" />
                      ) : (
                        <Image className="h-2.5 w-2.5 shrink-0" />
                      )}
                      <span className="truncate">
                        {post.caption ? post.caption.substring(0, 15) : "Sin texto"}
                      </span>
                    </div>
                  ))}
                  {dayPosts.length > 2 && (
                    <span className="text-[10px] text-slate-400 px-1">
                      +{dayPosts.length - 2} mas
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
