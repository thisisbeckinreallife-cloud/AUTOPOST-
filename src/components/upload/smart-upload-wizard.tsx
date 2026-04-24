"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  Loader2,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropZone } from "./drop-zone";
import { PostPreviewList } from "./post-preview-list";
import {
  ScheduleConfig,
  getDefaultScheduleSettings,
  calculatePublishDates,
  type ScheduleSettings,
} from "./schedule-config";
import { CalendarPreview } from "./calendar-preview";
import { TutorialPanel } from "./tutorial-panel";
import {
  analyzeZip,
  analyzeDirectMedia,
  cleanupPreviews,
  type DetectedPost,
  type AnalysisResult,
} from "./post-analyzer";

type Step = "drop" | "analyzing" | "review" | "schedule" | "calendar" | "uploading";

const STEP_TITLES: Record<Step, string> = {
  drop: "Sube tus posts",
  analyzing: "Analizando tu contenido...",
  review: "Revisa tus posts",
  schedule: "Configura la publicacion",
  calendar: "Vista previa del calendario",
  uploading: "Subiendo tu contenido...",
};

const STEP_ORDER: Step[] = ["drop", "analyzing", "review", "schedule", "calendar", "uploading"];

interface SmartUploadWizardProps {
  businessSlug: string;
}

export function SmartUploadWizard({ businessSlug }: SmartUploadWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("drop");
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [posts, setPosts] = useState<DetectedPost[]>([]);
  const [scheduleSettings, setScheduleSettings] = useState<ScheduleSettings>(
    getDefaultScheduleSettings()
  );
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState("");
  const [uploadMode, setUploadMode] = useState<"zip" | "direct">("zip");
  const [directFiles, setDirectFiles] = useState<File[]>([]);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout>>();

  function totalAnalyzingBytes(): number {
    if (directFiles.length > 0) return directFiles.reduce((n, f) => n + f.size, 0);
    return file?.size ?? 0;
  }

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      if (posts.length > 0) cleanupPreviews(posts);
    };
  }, []);

  // Auto-save simulation (state is already in memory)
  useEffect(() => {
    if (step === "review" || step === "schedule") {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(() => {
        // State is already saved in React state - this is for UX indication
      }, 500);
    }
  }, [posts, scheduleSettings, step]);

  // ─── Step handlers ──────────────────────────────────────────────────────

  const handleFileSelected = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    setError("");
    setStep("analyzing");

    try {
      const result = await analyzeZip(selectedFile);
      setAnalysis(result);
      setPosts(result.posts);

      if (result.posts.length === 0) {
        setError(result.summary);
        setStep("drop");
        return;
      }

      setStep("review");
    } catch (err) {
      setError("No pudimos analizar tu archivo. Verifica que sea un ZIP valido.");
      setStep("drop");
    }
  }, []);

  const handleDirectMediaSelected = useCallback((files: File[]) => {
    setError("");
    setUploadMode("direct");
    setDirectFiles(files);
    setStep("analyzing");

    try {
      const result = analyzeDirectMedia(files);
      setAnalysis(result);
      setPosts(result.posts);

      if (result.posts.length === 0) {
        setError(result.summary);
        setStep("drop");
        return;
      }

      setStep("review");
    } catch (err) {
      setError("No pudimos analizar tus archivos. Verifica que sean fotos o videos validos.");
      setStep("drop");
    }
  }, []);

  function handleUpdatePost(id: string, updates: Partial<DetectedPost>) {
    setPosts((prev) => {
      const post = prev.find((p) => p.id === id);
      if (!post) return prev;

      if (
        updates.postType === "image" &&
        post.postType === "carousel" &&
        post.mediaFiles.length >= 2
      ) {
        const newPosts: DetectedPost[] = [];
        for (const p of prev) {
          if (p.id !== id) {
            newPosts.push(p);
            continue;
          }
          for (const media of p.mediaFiles) {
            newPosts.push({
              ...p,
              id: Math.random().toString(36).substring(2, 10),
              mediaFiles: [media],
              postType: media.type === "video" ? "reel" : "image",
              sourceName: media.filename,
              statusMessage: p.caption ? "Listo para publicar" : "Sin texto. Puedes agregarlo ahora.",
            });
          }
        }
        return newPosts;
      }

      return prev.map((p) => (p.id === id ? { ...p, ...updates } : p));
    });
  }

  function handleRemovePost(id: string) {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  function handleScheduleChange(settings: ScheduleSettings) {
    setScheduleSettings(settings);
  }

  function applyScheduleToPosts() {
    const validPosts = posts.filter((p) => p.status !== "error");
    const dates = calculatePublishDates(validPosts.length, scheduleSettings);

    let dateIndex = 0;
    setPosts((prev) =>
      prev.map((p) => {
        if (p.status === "error") return p;
        const publishAt = dates[dateIndex] ?? null;
        dateIndex++;
        return { ...p, publishAt };
      })
    );
  }

  async function handleUpload() {
    setStep("uploading");
    setUploadProgress("Preparando tus posts...");
    setError("");

    try {
      const validPosts = posts.filter((p) => p.status !== "error");

      if (validPosts.length === 0) {
        setError("No hay posts validos para subir.");
        setStep("calendar");
        return;
      }

      if (uploadMode === "direct") {
        await handleDirectUpload(validPosts);
      } else {
        await handleZipUpload(validPosts);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Upload error:", msg, err);
      setError(`Error: ${msg}. Comprueba tu conexion e intentalo de nuevo.`);
      setStep("calendar");
    }
  }

  async function handleDirectUpload(validPosts: DetectedPost[]) {
    // 1. Get a batchId for all presign calls
    setUploadProgress("Obteniendo permiso de subida...");

    // Build a map from filename to File for lookup
    const fileMap = new Map<string, File>();
    for (const f of directFiles) {
      fileMap.set(f.name, f);
    }

    // Presign + upload each file
    const firstPresign = await fetch("/api/batches/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessSlug,
        fileName: directFiles[0]?.name ?? "direct-upload",
        fileSize: directFiles[0]?.size ?? 0,
        contentType: directFiles[0]?.type,
      }),
    });

    if (!firstPresign.ok) {
      const data = await firstPresign.json().catch(() => ({ error: "Error del servidor" }));
      setError(data.error ?? `Error obteniendo URL de subida (${firstPresign.status})`);
      setStep("calendar");
      return;
    }

    const { data: firstPresignData } = await firstPresign.json();
    const batchId = firstPresignData.batchId;

    // Upload all unique media files across all posts
    const allMediaFiles: Array<{ file: File; media: DetectedPost["mediaFiles"][0] }> = [];
    for (const post of validPosts) {
      for (const media of post.mediaFiles) {
        const f = fileMap.get(media.filename);
        if (f && !allMediaFiles.some((m) => m.file.name === f.name)) {
          allMediaFiles.push({ file: f, media });
        }
      }
    }

    // storageKey map: filename -> storageKey
    const storageKeyMap = new Map<string, string>();

    setUploadProgress(`Subiendo ${allMediaFiles.length} archivo${allMediaFiles.length !== 1 ? "s" : ""}...`);

    for (let i = 0; i < allMediaFiles.length; i++) {
      const { file: mediaFile } = allMediaFiles[i];
      const fileName = mediaFile.name;

      // Use the first presign for the first file, get new ones for the rest
      let uploadUrl: string;
      let storageKey: string;

      if (i === 0) {
        uploadUrl = firstPresignData.uploadUrl;
        storageKey = firstPresignData.storageKey;
      } else {
        const presignRes = await fetch("/api/batches/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            businessSlug,
            fileName,
            fileSize: mediaFile.size,
            contentType: mediaFile.type,
          }),
        });

        if (!presignRes.ok) {
          const data = await presignRes.json().catch(() => ({ error: "Error del servidor" }));
          setError(data.error ?? `Error obteniendo URL de subida para ${fileName}`);
          setStep("calendar");
          return;
        }

        const { data: presignData } = await presignRes.json();
        uploadUrl = presignData.uploadUrl;
        storageKey = presignData.storageKey;
      }

      storageKeyMap.set(fileName, storageKey);

      setUploadProgress(`Subiendo ${i + 1} de ${allMediaFiles.length}...`);
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: mediaFile,
      });

      if (!uploadRes.ok) {
        let detail = "";
        try { detail = await uploadRes.text(); } catch {}
        setError(`Error subiendo ${fileName} (${uploadRes.status}): ${detail.substring(0, 200)}`);
        setStep("calendar");
        return;
      }
    }

    // 2. Call the direct batch endpoint
    setUploadProgress("Procesando tus posts...");

    const directPosts = validPosts.map((post, idx) => {
      const publishAt = post.publishAt
        ? new Date(Math.max(post.publishAt.getTime(), Date.now() + 10 * 60 * 1000)).toISOString()
        : new Date(Date.now() + (24 + idx) * 60 * 60 * 1000).toISOString();

      return {
        storageKeys: post.mediaFiles.map((m) => storageKeyMap.get(m.filename) ?? ""),
        filenames: post.mediaFiles.map((m) => m.filename),
        fileSizes: post.mediaFiles.map((m) => m.size),
        mimeTypes: post.mediaFiles.map((m) => m.mimeType),
        caption: post.caption || "",
        postType: post.postType,
        publishAt,
        collaborators: post.collaborators?.length ? post.collaborators : undefined,
      };
    });

    const processRes = await fetch("/api/batches/direct", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessSlug,
        batchId,
        posts: directPosts,
      }),
    });

    const contentType = processRes.headers.get("content-type") ?? "";
    let processData: { error?: string; data?: { batchId: string } };
    if (contentType.includes("application/json")) {
      processData = await processRes.json();
    } else {
      const text = await processRes.text();
      processData = { error: `Error del servidor (${processRes.status}): ${text.substring(0, 200)}` };
    }

    if (!processRes.ok) {
      setError(processData.error ?? `Error procesando (${processRes.status}). Intentalo de nuevo.`);
      setStep("calendar");
      return;
    }

    setUploadProgress("Listo! Redirigiendo...");
    cleanupPreviews(posts);
    router.push(`/businesses/${businessSlug}/batches/${processData.data!.batchId}`);
  }

  async function handleZipUpload(validPosts: DetectedPost[]) {
    if (!file) return;

    const scheduleOverrides = validPosts.map((post, idx) => ({
      index: idx,
      publishAt: post.publishAt
        ? new Date(Math.max(post.publishAt.getTime(), Date.now() + 10 * 60 * 1000)).toISOString()
        : new Date(Date.now() + (24 + idx) * 60 * 60 * 1000).toISOString(),
      caption: post.caption || undefined,
      postType: post.postType,
    }));

    setUploadProgress("Obteniendo permiso de subida...");
    const presignRes = await fetch("/api/batches/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessSlug,
        fileName: file.name,
        fileSize: file.size,
      }),
    });

    if (!presignRes.ok) {
      const presignData = await presignRes.json().catch(() => ({ error: "Error del servidor" }));
      setError(presignData.error ?? `Error obteniendo URL de subida (${presignRes.status})`);
      setStep("calendar");
      return;
    }

    const { data: presignData } = await presignRes.json();
    const { uploadUrl, storageKey, batchId, businessId } = presignData;

    setUploadProgress("Subiendo archivo a la nube...");
    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
    });

    if (!uploadRes.ok) {
      let detail = "";
      try { detail = await uploadRes.text(); } catch {}
      console.error("R2 upload error:", uploadRes.status, detail);
      setError(`Error subiendo a almacenamiento (${uploadRes.status}): ${detail.substring(0, 200)}`);
      setStep("calendar");
      return;
    }

    setUploadProgress("Procesando tus posts...");
    const processRes = await fetch("/api/batches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        batchId,
        businessId,
        storageKey,
        fileName: file.name,
        fileSize: file.size,
        schedule: scheduleOverrides,
      }),
    });

    const contentType = processRes.headers.get("content-type") ?? "";
    let processData: { error?: string; data?: { batchId: string } };
    if (contentType.includes("application/json")) {
      processData = await processRes.json();
    } else {
      const text = await processRes.text();
      processData = { error: `Error del servidor (${processRes.status}): ${text.substring(0, 200)}` };
    }

    if (!processRes.ok) {
      if (processRes.status === 409) {
        setError("Este contenido ya fue subido anteriormente. Revisa tus batches.");
      } else {
        setError(processData.error ?? `Error procesando (${processRes.status}). Intentalo de nuevo.`);
      }
      setStep("calendar");
      return;
    }

    setUploadProgress("Listo! Redirigiendo...");
    cleanupPreviews(posts);
    router.push(`/businesses/${businessSlug}/batches/${processData.data!.batchId}`);
  }

  // ─── Navigation ─────────────────────────────────────────────────────────

  function canGoNext(): boolean {
    switch (step) {
      case "review":
        return posts.filter((p) => p.status !== "error").length > 0;
      case "schedule":
        return true;
      case "calendar":
        return true;
      default:
        return false;
    }
  }

  function goNext() {
    const idx = STEP_ORDER.indexOf(step);
    if (step === "review") {
      setStep("schedule");
    } else if (step === "schedule") {
      applyScheduleToPosts();
      setStep("calendar");
    } else if (step === "calendar") {
      handleUpload();
    } else if (idx < STEP_ORDER.length - 1) {
      setStep(STEP_ORDER[idx + 1]);
    }
  }

  function goBack() {
    if (step === "review") {
      cleanupPreviews(posts);
      setPosts([]);
      setAnalysis(null);
      setFile(null);
      setDirectFiles([]);
      setUploadMode("zip");
      setStep("drop");
    } else if (step === "schedule") {
      setStep("review");
    } else if (step === "calendar") {
      setStep("schedule");
    }
  }

  const currentStepIndex = STEP_ORDER.indexOf(step);
  const navigableSteps = ["review", "schedule", "calendar"];
  const validPostCount = posts.filter((p) => p.status !== "error").length;

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-xl font-bold text-zinc-900">{STEP_TITLES[step]}</h1>
        {step === "drop" && (
          <p className="text-zinc-600 text-sm mt-1">
            Sube un video, foto, carpeta o ZIP. Nosotros hacemos el resto.
          </p>
        )}
      </div>

      {/* Step indicator */}
      {navigableSteps.includes(step) && (
        <div className="flex items-center gap-2">
          {["Revisar", "Configurar", "Calendario"].map((label, i) => {
            const stepIdx = i + 2;
            const isActive = currentStepIndex >= stepIdx;
            const isCurrent = currentStepIndex === stepIdx;
            return (
              <div key={label} className="flex items-center gap-2">
                {i > 0 && (
                  <div className={`w-8 h-px ${isActive ? "bg-zinc-900" : "bg-zinc-300"}`} />
                )}
                <div
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
                    isCurrent
                      ? "bg-zinc-900 text-white"
                      : isActive
                        ? "bg-zinc-200 text-zinc-900"
                        : "bg-zinc-100 text-zinc-500"
                  }`}
                >
                  <span>{i + 1}</span>
                  <span>{label}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="rounded-xl bg-red-500/8 border border-red-500/15 px-4 py-3 text-sm text-red-400 animate-fade-in">
          {error}
        </div>
      )}

      {/* Step content */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6">
        <div>
          {step === "drop" && (
            <DropZone
              onFileSelected={handleFileSelected}
              onDirectMediaSelected={handleDirectMediaSelected}
            />
          )}

          {step === "analyzing" && (
            <AnalyzingProgress
              totalBytes={totalAnalyzingBytes()}
              fileCount={directFiles.length || 1}
            />
          )}

          {step === "review" && analysis && (
            <PostPreviewList
              analysis={analysis}
              posts={posts}
              onUpdatePost={handleUpdatePost}
              onRemovePost={handleRemovePost}
            />
          )}

          {step === "schedule" && (
            <ScheduleConfig
              postCount={validPostCount}
              initialSettings={scheduleSettings}
              onChange={handleScheduleChange}
            />
          )}

          {step === "calendar" && <CalendarPreview posts={posts} />}

          {step === "uploading" && (
            <div className="flex flex-col items-center justify-center py-16 space-y-5 animate-fade-up">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center">
                <Upload className="h-8 w-8 text-emerald-700 animate-pulse-subtle" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-zinc-900">{uploadProgress}</p>
                <p className="text-sm text-zinc-600 mt-1">No cierres esta página.</p>
              </div>
              <div className="w-48 h-1 bg-zinc-200 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full animate-[progress_1.5s_ease-in-out_infinite]" />
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Tutorial panel */}
        {step !== "analyzing" && step !== "uploading" && (
          <div className="hidden lg:block">
            <div className="sticky top-6">
              <TutorialPanel currentStep={step} />

              {step === "review" && posts.length > 0 && (
                <div className="mt-4 rounded-xl border border-white/[0.06] bg-surface-card p-4 space-y-3">
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Resumen
                  </p>
                  <div className="space-y-2">
                    <SummaryStat label="Posts totales" value={posts.length} />
                    <SummaryStat label="Listos" value={posts.filter((p) => p.status === "complete").length} dot="green" />
                    <SummaryStat label="Incompletos" value={posts.filter((p) => p.status === "incomplete").length} dot="amber" />
                    {posts.some((p) => p.status === "error") && (
                      <SummaryStat label="Con error" value={posts.filter((p) => p.status === "error").length} dot="red" />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      {navigableSteps.includes(step) && (
        <div className="flex items-center justify-between pt-4 border-t border-zinc-200">
          <Button variant="ghost" onClick={goBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {step === "review" ? "Cambiar archivo" : "Atras"}
          </Button>

          <div className="flex items-center gap-3">
            {step === "review" && (
              <p className="text-xs text-zinc-500">
                {validPostCount} post{validPostCount !== 1 ? "s" : ""} listo{validPostCount !== 1 ? "s" : ""}
              </p>
            )}
            <Button
              onClick={goNext}
              disabled={!canGoNext()}
              className="min-w-[140px]"
            >
              {step === "calendar" ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Programar {validPostCount} posts
                </>
              ) : (
                <>
                  Siguiente
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryStat({ label, value, dot }: { label: string; value: number; dot?: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-zinc-500 flex items-center gap-1.5">
        {dot && <span className={`w-1.5 h-1.5 rounded-full bg-${dot}-500`} />}
        {label}
      </span>
      <span className="font-medium text-zinc-300 tabular-nums">{value}</span>
    </div>
  );
}

function estimateAnalyzingSeconds(bytes: number, fileCount: number): number {
  // Empirical: ~2s base + ~0.8s per MB + ~0.1s per file
  const mb = bytes / (1024 * 1024);
  return Math.max(3, Math.round(2 + mb * 0.8 + fileCount * 0.1));
}

function formatSeconds(s: number): string {
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return r > 0 ? `${m}m ${r}s` : `${m}m`;
}

function formatMB(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  if (mb < 1) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${mb.toFixed(1)} MB`;
}

function AnalyzingProgress({ totalBytes, fileCount }: { totalBytes: number; fileCount: number }) {
  const [elapsed, setElapsed] = useState(0);
  const estimateS = estimateAnalyzingSeconds(totalBytes, fileCount);

  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 500);
    return () => clearInterval(timer);
  }, []);

  const progressPct = Math.min(95, Math.round((elapsed / estimateS) * 100));
  const overBudget = elapsed > estimateS;

  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-5 animate-fade-up">
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-200 border border-zinc-300 flex items-center justify-center">
          <Sparkles className="h-8 w-8 text-zinc-700 animate-pulse-subtle" />
        </div>
        <Loader2 className="absolute -top-1 -right-1 h-5 w-5 text-zinc-900 animate-spin" />
      </div>
      <div className="text-center">
        <p className="font-semibold text-zinc-900">Analizando tu contenido...</p>
        <p className="text-sm text-zinc-600 mt-1">
          Detectando fotos, videos y captions de {formatMB(totalBytes)}
        </p>
      </div>

      <div className="w-64 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-600 tabular-nums">
          <span>{elapsed}s transcurridos</span>
          <span>
            {overBudget ? "casi listo..." : `~${formatSeconds(Math.max(1, estimateS - elapsed))} restante`}
          </span>
        </div>
        <div className="h-1.5 bg-zinc-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-zinc-900 rounded-full transition-all duration-500"
            style={{ width: `${overBudget ? 95 : progressPct}%` }}
          />
        </div>
        <p className="text-[10px] text-center text-zinc-500">
          Estimado: ~{formatSeconds(estimateS)} · {fileCount} {fileCount === 1 ? "archivo" : "archivos"}
        </p>
      </div>
    </div>
  );
}
