"use client";

import { useRef, useState } from "react";
import { analyzeZip } from "@/components/upload/post-analyzer";
import type { AnalysisResult } from "@/components/upload/post-analyzer";
import { Upload, Zap, Image, Film, Layers, CheckCircle, AlertTriangle, ArrowRight, Lock } from "lucide-react";
import Link from "next/link";

type DemoState = "idle" | "analyzing" | "done" | "error";

export default function DemoPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<DemoState>("idle");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [dragOver, setDragOver] = useState(false);

  async function handleFile(file: File) {
    if (!file.name.endsWith(".zip")) {
      setErrorMsg("Por favor sube un archivo .zip");
      setState("error");
      return;
    }
    setState("analyzing");
    setErrorMsg("");
    try {
      const res = await analyzeZip(file);
      setResult(res);
      setState("done");
    } catch (e) {
      setErrorMsg((e as Error).message ?? "Error al analizar el ZIP");
      setState("error");
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  const completePosts = result?.posts.filter((p) => p.status === "complete") ?? [];
  const incompletePosts = result?.posts.filter((p) => p.status !== "complete") ?? [];
  const carousels = result?.posts.filter((p) => p.postType === "carousel") ?? [];
  const reels = result?.posts.filter((p) => p.postType === "reel") ?? [];
  const images = result?.posts.filter((p) => p.postType === "image") ?? [];

  return (
    <div className="min-h-screen bg-surface-primary text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/[0.04]">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-brand-500/15 to-accent-violet/10 border border-brand-500/20 flex items-center justify-center">
            <Zap className="h-3.5 w-3.5 text-brand-400" />
          </div>
          <span className="font-display font-bold text-sm text-white">
            Auto<span className="text-gradient">Post</span>
          </span>
        </Link>
        <Link
          href="/login"
          className="text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5"
        >
          Iniciar sesión <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-12 space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <p className="text-xs font-semibold text-brand-400 uppercase tracking-[0.2em]">Demo gratuita</p>
          <h1 className="font-display font-bold text-3xl sm:text-4xl tracking-tight">
            Prueba AutoPost{" "}
            <span className="text-gradient">sin registrarte</span>
          </h1>
          <p className="text-zinc-400 text-sm leading-relaxed max-w-md mx-auto">
            Sube un ZIP con tus posts y verás exactamente cómo AutoPost los detecta, organiza y clasifica. Sin cuenta, sin Instagram.
          </p>
        </div>

        {/* Drop zone */}
        {state === "idle" || state === "error" ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`relative rounded-2xl border-2 border-dashed cursor-pointer transition-all p-12 text-center ${
              dragOver
                ? "border-brand-500/60 bg-brand-500/[0.06]"
                : "border-white/[0.08] bg-surface-card hover:border-brand-500/30 hover:bg-brand-500/[0.03]"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".zip"
              onChange={handleInputChange}
              className="hidden"
            />
            <Upload className="h-10 w-10 mx-auto text-zinc-600 mb-4" />
            <p className="text-zinc-300 font-semibold mb-1">Arrastra tu ZIP aquí</p>
            <p className="text-zinc-600 text-sm">o haz clic para seleccionarlo</p>
            {state === "error" && (
              <p className="mt-4 text-sm text-red-400 flex items-center justify-center gap-1.5">
                <AlertTriangle className="h-4 w-4" />{errorMsg}
              </p>
            )}
          </div>
        ) : state === "analyzing" ? (
          <div className="rounded-2xl border border-white/[0.06] bg-surface-card p-12 text-center">
            <div className="w-10 h-10 rounded-full border-2 border-brand-500 border-t-transparent animate-spin mx-auto mb-4" />
            <p className="text-zinc-300 font-semibold">Analizando tu contenido...</p>
            <p className="text-zinc-600 text-sm mt-1">Detectando carruseles, captions y fechas</p>
          </div>
        ) : null}

        {/* Results */}
        {state === "done" && result && (
          <div className="space-y-5 animate-fade-up">
            {/* Summary banner */}
            <div className="rounded-xl border border-brand-500/20 bg-brand-500/[0.05] p-5 flex items-center gap-4">
              <CheckCircle className="h-6 w-6 text-brand-400 shrink-0" />
              <div>
                <p className="font-semibold text-white">{result.summary}</p>
                <p className="text-sm text-zinc-500 mt-0.5">
                  Patrón detectado: <span className="text-zinc-300 font-medium">{result.detectedPattern}</span>
                </p>
              </div>
            </div>

            {/* Type breakdown */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-white/[0.06] bg-surface-card p-4 text-center">
                <Image className="h-5 w-5 text-green-400 mx-auto mb-1.5" />
                <p className="font-display font-bold text-2xl text-white tabular-nums">{images.length}</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">Imágenes</p>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-surface-card p-4 text-center">
                <Layers className="h-5 w-5 text-blue-400 mx-auto mb-1.5" />
                <p className="font-display font-bold text-2xl text-white tabular-nums">{carousels.length}</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">Carruseles</p>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-surface-card p-4 text-center">
                <Film className="h-5 w-5 text-purple-400 mx-auto mb-1.5" />
                <p className="font-display font-bold text-2xl text-white tabular-nums">{reels.length}</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">Reels</p>
              </div>
            </div>

            {/* Post list preview */}
            {completePosts.length > 0 && (
              <div className="rounded-xl border border-white/[0.06] bg-surface-card overflow-hidden">
                <div className="px-5 py-3 border-b border-white/[0.04]">
                  <p className="text-sm font-semibold text-zinc-300">
                    {completePosts.length} post{completePosts.length !== 1 ? "s" : ""} listos para publicar
                  </p>
                </div>
                <div className="divide-y divide-white/[0.04]">
                  {completePosts.slice(0, 8).map((post) => (
                    <div key={post.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="shrink-0">
                        {post.postType === "reel" ? (
                          <Film className="h-4 w-4 text-purple-400" />
                        ) : post.postType === "carousel" ? (
                          <Layers className="h-4 w-4 text-blue-400" />
                        ) : (
                          <Image className="h-4 w-4 text-green-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-300 truncate font-medium">{post.sourceName}</p>
                        {post.caption && (
                          <p className="text-xs text-zinc-600 truncate mt-0.5">
                            {post.caption.slice(0, 80)}{post.caption.length > 80 ? "…" : ""}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 flex items-center gap-1.5">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 font-medium">
                          {post.mediaFiles.length} archivo{post.mediaFiles.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  ))}
                  {completePosts.length > 8 && (
                    <div className="px-5 py-3 text-xs text-zinc-600 text-center">
                      +{completePosts.length - 8} posts más…
                    </div>
                  )}
                </div>
              </div>
            )}

            {incompletePosts.length > 0 && (
              <div className="rounded-xl border border-amber-500/15 bg-amber-500/[0.04] p-4">
                <p className="text-sm font-medium text-amber-400 flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  {incompletePosts.length} post{incompletePosts.length !== 1 ? "s" : ""} con información incompleta
                </p>
                {incompletePosts.slice(0, 3).map((post) => (
                  <p key={post.id} className="text-xs text-zinc-500 ml-6">• {post.sourceName}: {post.statusMessage}</p>
                ))}
              </div>
            )}

            {result.warnings.length > 0 && (
              <div className="space-y-1">
                {result.warnings.map((w, i) => (
                  <p key={i} className="text-xs text-zinc-600 flex items-start gap-1.5">
                    <AlertTriangle className="h-3 w-3 text-zinc-700 shrink-0 mt-0.5" />{w}
                  </p>
                ))}
              </div>
            )}

            {/* CTA */}
            <div className="rounded-2xl border border-brand-500/20 bg-gradient-to-r from-brand-500/[0.06] to-accent-violet/[0.04] p-6 text-center space-y-4">
              <Lock className="h-6 w-6 text-brand-400 mx-auto" />
              <div>
                <p className="font-display font-bold text-white text-lg">¿Listo para publicar de verdad?</p>
                <p className="text-zinc-400 text-sm mt-1">
                  Conecta tu Instagram y programa {completePosts.length > 0 ? `estos ${completePosts.length} posts` : "tu contenido"} en segundos.
                </p>
              </div>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 bg-gradient-brand-vivid text-white px-6 py-3 rounded-lg text-sm font-semibold transition-all hover:shadow-glow hover:-translate-y-px"
              >
                Crear cuenta gratis
                <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="text-xs text-zinc-600">Sin tarjeta de crédito · Cancela cuando quieras</p>
            </div>

            {/* Try again */}
            <button
              type="button"
              onClick={() => { setState("idle"); setResult(null); }}
              className="w-full text-sm text-zinc-600 hover:text-zinc-400 py-2 transition-colors"
            >
              Probar con otro ZIP
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
