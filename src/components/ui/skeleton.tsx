import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded bg-zinc-800/60 bg-gradient-to-r from-zinc-800/60 via-zinc-700/40 to-zinc-800/60 bg-[length:200%_100%] animate-shimmer",
        className
      )}
    />
  );
}

export function BatchDetailSkeleton() {
  return (
    <div className="space-y-6 max-w-2xl animate-fade-in">
      <div>
        <Skeleton className="h-7 w-64 mb-2" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-white/[0.06] bg-surface-card p-4 text-center">
            <Skeleton className="h-9 w-12 mx-auto mb-2" />
            <Skeleton className="h-3 w-20 mx-auto" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-white/[0.06] bg-surface-card p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <Skeleton className="h-5 w-48 mb-2" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      </div>
      <div>
        <Skeleton className="h-5 w-28 mb-3" />
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border border-white/[0.04] bg-surface-card px-4 py-3">
              <Skeleton className="h-5 w-5 rounded shrink-0" />
              <div className="flex-1 min-w-0">
                <Skeleton className="h-4 w-40 mb-1.5" />
                <Skeleton className="h-3 w-56" />
              </div>
              <Skeleton className="h-3 w-24 shrink-0" />
              <Skeleton className="h-5 w-16 rounded-full shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PostDetailSkeleton() {
  return (
    <div className="space-y-6 max-w-3xl animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
      </div>
      <div className="rounded-xl border border-white/[0.06] bg-surface-card">
        <div className="p-6">
          <Skeleton className="h-5 w-32 mb-4" />
        </div>
        <div className="px-6 pb-6 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-4 w-36 shrink-0" />
              <Skeleton className="h-4 w-48" />
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-white/[0.06] bg-surface-card">
        <div className="p-6">
          <Skeleton className="h-5 w-20 mb-4" />
        </div>
        <div className="px-6 pb-6">
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
      <div className="rounded-xl border border-white/[0.06] bg-surface-card">
        <div className="p-6">
          <Skeleton className="h-5 w-40 mb-4" />
        </div>
        <div className="px-6 pb-6 space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
