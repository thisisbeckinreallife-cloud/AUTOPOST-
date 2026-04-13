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
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout>>();

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
    if (!file) return;
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
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Upload error:", msg, err);
      setError(`Error: ${msg}. Comprueba tu conexion e intentalo de nuevo.`);
      setStep("calendar");
    }
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
        <h1 className="font-display text-xl font-bold text-white">{STEP_TITLES[step]}</h1>
        {step === "drop" && (
          <p className="text-zinc-500 text-sm mt-1">
            Sube una carpeta con tus fotos y textos. Nosotros hacemos el resto.
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
                  <div className={`w-8 h-px ${isActive ? "bg-brand-400" : "bg-zinc-800"}`} />
                )}
                <div
                  className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-all ${
                    isCurrent
                      ? "bg-gradient-brand-vivid text-white shadow-glow-sm"
                      : isActive
                        ? "bg-brand-500/15 text-brand-400"
                        : "bg-zinc-800/60 text-zinc-600"
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
          {step === "drop" && <DropZone onFileSelected={handleFileSelected} />}

          {step === "analyzing" && (
            <div className="flex flex-col items-center justify-center py-16 space-y-5 animate-fade-up">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500/15 to-accent-violet/10 border border-brand-500/15 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-brand-400 animate-pulse-subtle" />
                </div>
                <Loader2 className="absolute -top-1 -right-1 h-5 w-5 text-brand-400 animate-spin" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-zinc-200">Analizando tu contenido...</p>
                <p className="text-sm text-zinc-500 mt-1">
                  Detectando fotos, videos y textos.
                </p>
              </div>
              <div className="w-48 h-1 bg-zinc-800/60 rounded-full overflow-hidden">
                <div className="h-full bg-brand-500 rounded-full animate-[progress_2s_ease-in-out_infinite]" />
              </div>
            </div>
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
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500/12 to-emerald-500/8 border border-green-500/15 flex items-center justify-center">
                <Upload className="h-8 w-8 text-green-400 animate-pulse-subtle" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-zinc-200">{uploadProgress}</p>
                <p className="text-sm text-zinc-500 mt-1">No cierres esta pagina.</p>
              </div>
              <div className="w-48 h-1 bg-zinc-800/60 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full animate-[progress_1.5s_ease-in-out_infinite]" />
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
        <div className="flex items-center justify-between pt-4 border-t border-white/[0.04]">
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
