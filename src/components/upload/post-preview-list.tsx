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
    <div className="space-y-5">
      {/* Pattern detected banner */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-5">
        <p className="font-semibold text-slate-800">{patternInfo.title}</p>
        <p className="text-sm text-slate-500 mt-1">{patternInfo.desc}</p>
      </div>

      {/* Warnings */}
      {analysis.warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-1">
          {analysis.warnings.map((w, i) => (
            <p key={i} className="text-sm text-amber-700 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              {w}
            </p>
          ))}
        </div>
      )}

      {/* Stats bar */}
      <div className="flex items-center gap-4 text-sm">
        <span className="font-semibold text-slate-700">{posts.length} posts</span>
        {completeCount > 0 && (
          <span className="flex items-center gap-1 text-green-600">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            {completeCount} listo{completeCount !== 1 ? "s" : ""}
          </span>
        )}
        {incompleteCount > 0 && (
          <span className="flex items-center gap-1 text-amber-600">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            {incompleteCount} incompleto{incompleteCount !== 1 ? "s" : ""}
          </span>
        )}
        {errorCount > 0 && (
          <span className="flex items-center gap-1 text-red-600">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            {errorCount} con error
          </span>
        )}
      </div>

      {/* Low confidence warning */}
      {posts.some((p) => p.matchConfidence === "low") && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-700 font-medium">
            Algunos posts fueron emparejados automaticamente. Revisa los marcados con un icono azul.
          </p>
        </div>
      )}

      {/* Post cards */}
      <div className="space-y-3">
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

// ─── Individual post card ───────────────────────────────────────────────────

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

  const statusIcon =
    post.status === "complete" ? (
      <CheckCircle2 className="h-5 w-5 text-green-500" />
    ) : post.status === "incomplete" ? (
      <Clock className="h-5 w-5 text-amber-500" />
    ) : (
      <AlertCircle className="h-5 w-5 text-red-500" />
    );

  const statusColor =
    post.status === "complete"
      ? "border-green-200 bg-green-50/30"
      : post.status === "incomplete"
        ? "border-amber-200 bg-amber-50/30"
        : "border-red-200 bg-red-50/30";

  const typeIcon =
    post.postType === "reel" ? (
      <Film className="h-4 w-4 text-purple-500" />
    ) : post.postType === "carousel" ? (
      <Layers className="h-4 w-4 text-blue-500" />
    ) : (
      <Image className="h-4 w-4 text-green-500" />
    );

  const typeLabel =
    post.postType === "reel"
      ? "Video"
      : post.postType === "carousel"
        ? `Carrusel (${post.mediaFiles.length} archivos)`
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
    <div className={`border rounded-xl transition-all ${statusColor}`}>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Status indicator */}
        {statusIcon}

        {/* Thumbnail */}
        <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center">
          {post.mediaFiles[0]?.previewUrl ? (
            <img
              src={post.mediaFiles[0].previewUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : post.mediaFiles[0]?.type === "video" ? (
            <Film className="h-5 w-5 text-slate-400" />
          ) : (
            <Image className="h-5 w-5 text-slate-300" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-slate-800 truncate">
              Post {index + 1}
            </p>
            {post.matchConfidence === "low" && (
              <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">
                Revisar
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 truncate">{post.statusMessage}</p>
        </div>

        {/* Type badge */}
        <span className="flex items-center gap-1 text-xs text-slate-500 shrink-0">
          {typeIcon}
          {typeLabel}
        </span>

        {/* Expand */}
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
        )}
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-slate-100">
          {/* Media thumbnails */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            {post.mediaFiles.map((media, i) => (
              <div
                key={i}
                className="w-20 h-20 rounded-lg overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center border border-slate-200"
              >
                {media.previewUrl ? (
                  <img
                    src={media.previewUrl}
                    alt={media.filename}
                    className="w-full h-full object-cover"
                  />
                ) : media.type === "video" ? (
                  <div className="text-center">
                    <Film className="h-6 w-6 text-slate-400 mx-auto" />
                    <p className="text-[10px] text-slate-400 mt-1">Video</p>
                  </div>
                ) : (
                  <Image className="h-6 w-6 text-slate-300" />
                )}
              </div>
            ))}
          </div>

          {/* Post type selector */}
          {post.mediaFiles.length >= 2 && (
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                Tipo de publicacion
              </label>
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdate({ postType: "carousel" });
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    post.postType === "carousel"
                      ? "bg-blue-100 text-blue-700 ring-1 ring-blue-300"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  <Layers className="h-3.5 w-3.5" />
                  Carrusel ({post.mediaFiles.length} fotos)
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdate({ postType: "image" });
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    post.postType === "image"
                      ? "bg-green-100 text-green-700 ring-1 ring-green-300"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  <Image className="h-3.5 w-3.5" />
                  Posts separados
                </button>
              </div>
              {post.postType === "image" && post.mediaFiles.length >= 2 && (
                <p className="text-[11px] text-amber-600 mt-1.5">
                  Cada foto se publicara como un post individual.
                </p>
              )}
            </div>
          )}

          {/* Source info */}
          <div className="text-xs text-slate-400">
            Origen: <span className="font-mono">{post.sourceName}</span>
            {post.mediaFiles.length > 0 && (
              <span className="ml-2">
                &middot; {(post.mediaFiles.reduce((s, m) => s + m.size, 0) / 1024 / 1024).toFixed(1)} MB
              </span>
            )}
          </div>

          {/* Caption */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-slate-600">Texto del post</label>
              {!editingCaption && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingCaption(true);
                  }}
                  className="text-xs text-pink-500 hover:text-pink-600 flex items-center gap-1"
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
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm min-h-[80px] focus:ring-2 focus:ring-pink-300 focus:border-pink-300 outline-none resize-y"
                  maxLength={2200}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    {captionDraft.length}/2200
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        cancelCaption();
                      }}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        saveCaption();
                      }}
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Guardar
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 min-h-[40px]">
                {post.caption || (
                  <span className="text-slate-300 italic">Sin texto</span>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1"
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
