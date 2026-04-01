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
  repackZip,
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
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
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
      // Repack ZIP with user's edits and schedule
      setUploadProgress("Empaquetando tu contenido...");
      const repackedBlob = await repackZip(posts.filter((p) => p.status !== "error"));
      const repackedFile = new File([repackedBlob], file.name, { type: "application/zip" });

      setUploadProgress("Subiendo a AutoPost...");
      const fd = new FormData();
      fd.append("file", repackedFile);
      fd.append("businessSlug", businessSlug);

      const res = await fetch("/api/batches", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "No se pudo subir el archivo. Intentalo de nuevo.");
        setStep("calendar");
        return;
      }

      setUploadProgress("Listo! Redirigiendo...");
      // Cleanup
      cleanupPreviews(posts);
      router.push(`/businesses/${businessSlug}/batches/${data.data.batchId}`);
    } catch {
      setError("Error de red. Comprueba tu conexion.");
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
      // Clean up and go back to drop
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

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{STEP_TITLES[step]}</h1>
        {step === "drop" && (
          <p className="text-slate-400 mt-1">
            Sube una carpeta con tus fotos y textos. Nosotros hacemos el resto.
          </p>
        )}
      </div>

      {/* Step indicator */}
      {navigableSteps.includes(step) && (
        <div className="flex items-center gap-2">
          {["Revisar", "Configurar", "Calendario"].map((label, i) => {
            const stepIdx = i + 2; // review=2, schedule=3, calendar=4
            const isActive = currentStepIndex >= stepIdx;
            const isCurrent = currentStepIndex === stepIdx;
            return (
              <div key={label} className="flex items-center gap-2">
                {i > 0 && (
                  <div
                    className={`w-8 h-0.5 ${
                      isActive ? "bg-pink-400" : "bg-slate-200"
                    }`}
                  />
                )}
                <div
                  className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-all ${
                    isCurrent
                      ? "bg-pink-500 text-white shadow-sm"
                      : isActive
                        ? "bg-pink-100 text-pink-600"
                        : "bg-slate-100 text-slate-400"
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
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Step content */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <div>
          {step === "drop" && <DropZone onFileSelected={handleFileSelected} />}

          {step === "analyzing" && (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                  <Sparkles className="h-10 w-10 text-pink-500 animate-pulse" />
                </div>
                <Loader2 className="absolute -top-1 -right-1 h-6 w-6 text-pink-400 animate-spin" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-slate-800">Analizando tu contenido...</p>
                <p className="text-sm text-slate-400 mt-1">
                  Detectando fotos, videos y textos. Esto tarda unos segundos.
                </p>
              </div>
              {/* Animated progress bar */}
              <div className="w-48 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-pink-400 to-purple-400 rounded-full animate-[progress_2s_ease-in-out_infinite]" />
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
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                <Upload className="h-10 w-10 text-green-500 animate-bounce" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-slate-800">{uploadProgress}</p>
                <p className="text-sm text-slate-400 mt-1">
                  No cierres esta pagina.
                </p>
              </div>
              <div className="w-48 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-400 to-emerald-400 rounded-full animate-[progress_1.5s_ease-in-out_infinite]" />
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Tutorial panel */}
        {step !== "analyzing" && step !== "uploading" && (
          <div className="hidden lg:block">
            <div className="sticky top-6">
              <TutorialPanel currentStep={step} />

              {/* Quick stats in sidebar during review */}
              {step === "review" && posts.length > 0 && (
                <div className="mt-4 bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Resumen
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Posts totales</span>
                      <span className="font-medium text-slate-800">{posts.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        Listos
                      </span>
                      <span className="font-medium">
                        {posts.filter((p) => p.status === "complete").length}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-amber-600 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        Incompletos
                      </span>
                      <span className="font-medium">
                        {posts.filter((p) => p.status === "incomplete").length}
                      </span>
                    </div>
                    {posts.some((p) => p.status === "error") && (
                      <div className="flex justify-between text-sm">
                        <span className="text-red-600 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-red-500" />
                          Con error
                        </span>
                        <span className="font-medium">
                          {posts.filter((p) => p.status === "error").length}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      {navigableSteps.includes(step) && (
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <Button variant="ghost" onClick={goBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {step === "review" ? "Cambiar archivo" : "Atras"}
          </Button>

          <div className="flex items-center gap-3">
            {step === "review" && (
              <p className="text-xs text-slate-400">
                {validPostCount} post{validPostCount !== 1 ? "s" : ""} listo
                {validPostCount !== 1 ? "s" : ""}
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
