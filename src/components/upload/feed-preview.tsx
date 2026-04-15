"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Image as ImageIcon, Film, Layers, Calendar } from "lucide-react";

export interface FeedPreviewPost {
  id: string;
  imageUrl: string;
  caption: string;
  publishAt: string; // ISO string
  postType: string;
}

interface FeedPreviewProps {
  posts: FeedPreviewPost[];
}

export function FeedPreview({ posts }: FeedPreviewProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Sort chronologically so oldest = top-left
  const sorted = [...posts].sort(
    (a, b) => new Date(a.publishAt).getTime() - new Date(b.publishAt).getTime()
  );

  if (sorted.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-zinc-500">
        No hay posts para mostrar en el feed.
      </div>
    );
  }

  function typeIcon(postType: string) {
    if (postType === "REEL") return <Film className="h-3.5 w-3.5 text-white drop-shadow" />;
    if (postType === "CAROUSEL") return <Layers className="h-3.5 w-3.5 text-white drop-shadow" />;
    return <ImageIcon className="h-3.5 w-3.5 text-white drop-shadow" />;
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-zinc-500 text-center">
        Vista previa del feed · {sorted.length} post{sorted.length !== 1 ? "s" : ""} en orden cronológico
      </p>
      <div className="grid grid-cols-3 gap-0.5 rounded-xl overflow-hidden border border-white/[0.06]">
        {sorted.map((post) => {
          const isHovered = hoveredId === post.id;
          let publishDate = "";
          try {
            publishDate = format(new Date(post.publishAt), "d MMM yyyy · HH:mm", { locale: es });
          } catch {
            publishDate = post.publishAt;
          }

          return (
            <div
              key={post.id}
              className="relative aspect-square bg-surface-card cursor-default overflow-hidden group"
              onMouseEnter={() => setHoveredId(post.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Image */}
              {post.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.imageUrl}
                  alt={post.caption.slice(0, 40)}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-surface-elevated">
                  {typeIcon(post.postType)}
                </div>
              )}

              {/* Type badge top-right */}
              <div className="absolute top-1.5 right-1.5">
                {typeIcon(post.postType)}
              </div>

              {/* Hover overlay */}
              <div
                className={`absolute inset-0 bg-black/75 flex flex-col justify-end p-2 transition-opacity duration-200 ${
                  isHovered ? "opacity-100" : "opacity-0"
                }`}
              >
                <p className="text-[10px] text-zinc-300 line-clamp-2 leading-relaxed">
                  {post.caption || "Sin caption"}
                </p>
                <p className="text-[9px] text-zinc-500 flex items-center gap-1 mt-1">
                  <Calendar className="h-2.5 w-2.5 shrink-0" />
                  {publishDate}
                </p>
              </div>
            </div>
          );
        })}

        {/* Placeholder cells to complete last row */}
        {Array.from({ length: (3 - (sorted.length % 3)) % 3 }).map((_, i) => (
          <div key={`placeholder-${i}`} className="aspect-square bg-surface-card/40" />
        ))}
      </div>
      <p className="text-[10px] text-zinc-700 text-center">
        Pasa el cursor sobre cada celda para ver el caption y fecha de publicación
      </p>
    </div>
  );
}
