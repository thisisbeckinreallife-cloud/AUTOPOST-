import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatDateInTz(date: Date | string, tz: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: tz,
    timeZoneName: "short",
  }).format(new Date(date));
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    PUBLISHED: "bg-green-100 text-green-800",
    SCHEDULED: "bg-blue-100 text-blue-800",
    PUBLISHING: "bg-yellow-100 text-yellow-800",
    VALIDATED: "bg-teal-100 text-teal-800",
    READY: "bg-cyan-100 text-cyan-800",
    DRAFT: "bg-zinc-100 text-zinc-700",
    FAILED: "bg-red-100 text-red-800",
    CANCELLED: "bg-zinc-100 text-zinc-500",
    ACTIVE: "bg-green-100 text-green-800",
    TOKEN_EXPIRED: "bg-amber-100 text-amber-800",
    REVOKED: "bg-red-100 text-red-800",
    ERROR: "bg-red-100 text-red-800",
    PENDING: "bg-zinc-100 text-zinc-700",
  };
  return map[status] ?? "bg-zinc-100 text-zinc-600";
}
