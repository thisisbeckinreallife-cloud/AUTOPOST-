"use client";

import { useState } from "react";
import {
  Image,
  Film,
  Layers,
  ChevronDown,
  ChevronUp,
  Edit3,
  Check,
  X,
  AlertCircle,
  CheckCircle2,
  Clock,
  Trash2,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DetectedPost, AnalysisResult } from "./post-analyzer";

interface PostPreviewListProps {
  analysis: AnalysisResult;
  posts: DetectedPost[];
  onUpdatePost: (id: string, updates: Partial<DetectedPost>) => void;
  onRemovePost: (id: string) => void;
}

const PATTERN_MESSAGES: Record<string, { title: string; desc: string }> = {
  perfect: {
    title: "Estructura perfecta detectada",
    desc: "Tus posts estan bien organizados. Solo revisa que todo este correcto.",
  },
  flat_images: {
    title: "Fotos sueltas detectadas",
    desc: "Encontramos fotos sin texto. Cada foto sera un post. Puedes agregar el texto ahora.",
  },
  separated: {
    title: "Fotos y textos separados",
    desc: "Encontramos carpetas de fotos y textos. Los emparejamos automaticamente.",
  },
  name_matched: {
    title: "Archivos emparejados por nombre",
    desc: "Detectamos fotos y textos con el mismo nombre. Los conectamos automaticamente.",
  },
  mixed: {
    title: "Estructura mixta detectada",
    desc: "Tu archivo tiene diferentes formatos. Los organizamos lo mejor posible.",
  },
  only_text: {
    title: "Solo hay textos",
    desc: "No encontramos fotos ni videos. Necesitas al menos una imagen por post.",
  },
  unknown: {
    title: "No pudimos entender la estructura",
    desc: "Revisa que tu archivo tenga fotos o videos.",
  },
};

export function PostPreviewList({
  analysis,
  posts,
  onUpdatePost,
  onRemovePost,
}: PostPreviewListProps) {
  const patternInfo = PATTERN_MESSAGES[analysis.detectedPattern] ?? PATTERN_MESSAGES.unknown;
  const completeCount = posts.filter((p) => p.status === "complete").length;
  const incompleteCount = posts.filter((p) => p.status === "incomplete").length;
  const errorCount = posts.filter((p) => p.status === "error").length;

  return (
    <div className="space-y-4">
      {/* Pattern banner */}
      <div className="rounded-xl border border-white/[0.06] bg-surface-card p-5">
        <p className="font-semibold text-white">{patternInfo.title}</p>
        <p className="text-sm text-zinc-500 mt-1">{patternInfo.desc}</p>
      </div>

      {/* Warnings */}
      {analysis.warnings.length > 0 && (
        <div className="bg-amber-500/8 border border-amber-500/15 rounded-xl p-4 space-y-1.5">
          {analysis.warnings.map((w, i) => (
            <p key={i} className="text-sm text-amber-400 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              {w}
            </p>
          ))}
        </div>
      )}

      {/* Stats bar */}
      <div className="flex items-center gap-4 text-sm">
        <span className="font-semibold text-zinc-300">{posts.length} posts</span>
        {completeCount > 0 && (
          <span className="flex items-center gap-1.5 text-green-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            {completeCount} listo{completeCount !== 1 ? "s" : ""}
          </span>
        )}
        {incompleteCount > 0 && (
          <span className="flex items-center gap-1.5 text-amber-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            {incompleteCount} incompleto{incompleteCount !== 1 ? "s" : ""}
          </span>
        )}
        {errorCount > 0 && (
          <span className="flex items-center gap-1.5 text-red-400">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            {errorCount} con error
          </span>
        )}
      </div>

      {/* Low confidence */}
      {posts.some((p) => p.matchConfidence === "low") && (
        <div className="bg-blue-500/8 border border-blue-500/15 rounded-xl p-4">
          <p className="text-sm text-blue-400 font-medium">
            Algunos posts fueron emparejados automaticamente. Revisa los marcados con un icono azul.
          </p>
        </div>
      )}

      {/* Post cards */}
      <div className="space-y-2">
        {posts.map((post, index) => (
          <PostCard
            key={post.id}
            post={post}
            index={index}
            onUpdate={(updates) => onUpdatePost(post.id, updates)}
            onRemove={() => onRemovePost(post.id)}
          />
        ))}
      </div>
    </div>
  );
}

function PostCard({
  post,
  index,
  onUpdate,
  onRemove,
}: {
  post: DetectedPost;
  index: number;
  onUpdate: (updates: Partial<DetectedPost>) => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editingCaption, setEditingCaption] = useState(false);
  const [captionDraft, setCaptionDraft] = useState(post.caption);
  const [collabInput, setCollabInput] = useState("");

  const statusIcon =
    post.status === "complete" ? (
      <CheckCircle2 className="h-4 w-4 text-green-400" />
    ) : post.status === "incomplete" ? (
      <Clock className="h-4 w-4 text-amber-400" />
    ) : (
      <AlertCircle className="h-4 w-4 text-red-400" />
    );

  const borderColor =
    post.status === "complete"
      ? "border-green-500/10"
      : post.status === "incomplete"
        ? "border-amber-500/10"
        : "border-red-500/10";

  const typeIcon =
    post.postType === "reel" ? (
      <Film className="h-3.5 w-3.5 text-purple-400" />
    ) : post.postType === "carousel" ? (
      <Layers className="h-3.5 w-3.5 text-blue-400" />
    ) : (
      <Image className="h-3.5 w-3.5 text-green-400" />
    );

  const typeLabel =
    post.postType === "reel"
      ? "Video"
      : post.postType === "carousel"
        ? `Carrusel (${post.mediaFiles.length})`
        : "Foto";

  function saveCaption() {
    onUpdate({
      caption: captionDraft,
      captionSource: "user",
      status: captionDraft ? "complete" : "incomplete",
      statusMessage: captionDraft ? "Listo para publicar" : "Sin texto. Puedes agregarlo ahora.",
    });
    setEditingCaption(false);
  }

  function cancelCaption() {
    setCaptionDraft(post.caption);
    setEditingCaption(false);
  }

  return (
    <div className={`border rounded-xl bg-surface-card transition-all ${borderColor}`}>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {statusIcon}

        <div className="w-9 h-9 rounded-lg overflow-hidden bg-zinc-800 shrink-0 flex items-center justify-center">
          {post.mediaFiles[0]?.previewUrl ? (
            <img src={post.mediaFiles[0].previewUrl} alt="" className="w-full h-full object-cover" />
          ) : post.mediaFiles[0]?.type === "video" ? (
            <Film className="h-4 w-4 text-zinc-500" />
          ) : (
            <Image className="h-4 w-4 text-zinc-500" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-zinc-200 truncate">Post {index + 1}</p>
            {post.matchConfidence === "low" && (
              <span className="text-[10px] bg-blue-500/15 text-blue-400 px-1.5 py-0.5 rounded-full font-medium">
                Revisar
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-600 truncate">{post.statusMessage}</p>
        </div>

        <span className="flex items-center gap-1 text-xs text-zinc-500 shrink-0">
          {typeIcon}
          {typeLabel}
        </span>

        {expanded ? (
          <ChevronUp className="h-4 w-4 text-zinc-600 shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-zinc-600 shrink-0" />
        )}
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-white/[0.04]">
          {/* Media */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            {post.mediaFiles.map((media, i) => (
              <div key={i} className="w-16 h-16 rounded-lg overflow-hidden bg-zinc-800 shrink-0 flex items-center justify-center border border-white/[0.04]">
                {media.previewUrl ? (
                  <img src={media.previewUrl} alt={media.filename} className="w-full h-full object-cover" />
                ) : media.type === "video" ? (
                  <div className="text-center">
                    <Film className="h-5 w-5 text-zinc-500 mx-auto" />
                    <p className="text-[9px] text-zinc-600 mt-0.5">Video</p>
                  </div>
                ) : (
                  <Image className="h-5 w-5 text-zinc-500" />
                )}
              </div>
            ))}
          </div>

          {/* Post type selector */}
          {post.mediaFiles.length >= 2 && (
            <div>
              <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Tipo de publicacion</label>
              <div className="flex gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); onUpdate({ postType: "carousel" }); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    post.postType === "carousel"
                      ? "bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30"
                      : "bg-zinc-800/60 text-zinc-500 hover:text-zinc-400"
                  }`}
                >
                  <Layers className="h-3.5 w-3.5" />
                  Carrusel ({post.mediaFiles.length})
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onUpdate({ postType: "image" }); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    post.postType === "image"
                      ? "bg-green-500/15 text-green-400 ring-1 ring-green-500/30"
                      : "bg-zinc-800/60 text-zinc-500 hover:text-zinc-400"
                  }`}
                >
                  <Image className="h-3.5 w-3.5" />
                  Posts separados
                </button>
              </div>
              {post.postType === "image" && post.mediaFiles.length >= 2 && (
                <p className="text-[11px] text-amber-400 mt-1.5">
                  Cada foto se publicara como un post individual.
                </p>
              )}
            </div>
          )}

          {/* Source */}
          <div className="text-xs text-zinc-600">
            Origen: <span className="font-mono text-zinc-500">{post.sourceName}</span>
            {post.mediaFiles.length > 0 && (
              <span className="ml-2">
                &middot; {(post.mediaFiles.reduce((s, m) => s + m.size, 0) / 1024 / 1024).toFixed(1)} MB
              </span>
            )}
          </div>

          {/* Caption */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-zinc-500">Texto del post</label>
              {!editingCaption && (
                <button
                  onClick={(e) => { e.stopPropagation(); setEditingCaption(true); }}
                  className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors"
                >
                  <Edit3 className="h-3 w-3" />
                  {post.caption ? "Editar" : "Agregar texto"}
                </button>
              )}
            </div>

            {editingCaption ? (
              <div className="space-y-2">
                <textarea
                  value={captionDraft}
                  onChange={(e) => setCaptionDraft(e.target.value)}
                  placeholder="Escribe el texto de tu post..."
                  className="w-full min-h-[80px] resize-y"
                  maxLength={2200}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-600 tabular-nums">{captionDraft.length}/2200</span>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); cancelCaption(); }}>
                      <X className="h-3 w-3 mr-1" /> Cancelar
                    </Button>
                    <Button size="sm" onClick={(e) => { e.stopPropagation(); saveCaption(); }}>
                      <Check className="h-3 w-3 mr-1" /> Guardar
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-surface-secondary rounded-lg border border-white/[0.04] px-3 py-2 text-sm text-zinc-400 min-h-[40px]">
                {post.caption || <span className="text-zinc-600 italic">Sin texto</span>}
              </div>
            )}
          </div>

          {/* Collaborators */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-zinc-500">
                Colaboradores ({post.collaborators?.length ?? 0}/3)
              </label>
            </div>

            {/* Existing collaborators as chips */}
            {post.collaborators && post.collaborators.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {post.collaborators.map((username) => (
                  <span
                    key={username}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 text-xs font-medium"
                  >
                    @{username}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdate({
                          collaborators: post.collaborators.filter((u) => u !== username),
                        });
                      }}
                      className="hover:text-red-400 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Add collaborator input */}
            {(post.collaborators?.length ?? 0) < 3 && (
              <div className="flex gap-2">
                <div className="flex-1 flex items-center bg-surface-secondary rounded-lg border border-white/[0.04] px-3">
                  <span className="text-zinc-500 text-sm">@</span>
                  <input
                    type="text"
                    value={collabInput}
                    onChange={(e) => setCollabInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const username = collabInput.replace(/^@/, "").trim();
                        if (
                          username &&
                          !(post.collaborators ?? []).includes(username)
                        ) {
                          onUpdate({
                            collaborators: [...(post.collaborators ?? []), username],
                          });
                          setCollabInput("");
                        }
                      }
                    }}
                    placeholder="username"
                    className="flex-1 bg-transparent border-none outline-none text-sm text-zinc-300 placeholder:text-zinc-600 py-1.5 pl-0.5"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    const username = collabInput.replace(/^@/, "").trim();
                    if (
                      username &&
                      !(post.collaborators ?? []).includes(username)
                    ) {
                      onUpdate({
                        collaborators: [...(post.collaborators ?? []), username],
                      });
                      setCollabInput("");
                    }
                  }}
                >
                  <UserPlus className="h-3 w-3 mr-1" /> Agregar
                </Button>
              </div>
            )}
          </div>

          {/* Remove */}
          <div className="flex justify-end">
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="text-xs text-red-400/70 hover:text-red-400 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="h-3 w-3" />
              Quitar este post
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
