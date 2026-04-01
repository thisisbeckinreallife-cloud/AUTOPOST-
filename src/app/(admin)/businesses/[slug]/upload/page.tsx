"use client";

import { useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Upload,
  FileArchive,
  HelpCircle,
  Download,
  Image as ImageIcon,
  X,
  Calendar,
  Clock,
} from "lucide-react";
import JSZip from "jszip";

type UploadMode = "zip" | "images";

export default function UploadPage() {
  const { slug } = useParams() as { slug: string };
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<UploadMode | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");
  const [showHelp, setShowHelp] = useState(false);

  // Schedule settings
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState("10:00");
  const [frequency, setFrequency] = useState<"daily" | "custom">("daily");
  const [customHours, setCustomHours] = useState(24);

  const hasFiles = mode === "zip" ? !!zipFile : imageFiles.length > 0;

  // ── Drop handler ────────────────────────────────────────────────

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    processDroppedFiles(files);
  }

  function processDroppedFiles(files: File[]) {
    setError("");

    // Check if it's a ZIP
    const zip = files.find(
      (f) => f.name.endsWith(".zip") || f.type === "application/zip"
    );
    if (zip) {
      setMode("zip");
      setZipFile(zip);
      setImageFiles([]);
      return;
    }

    // Check for images/videos
    const mediaFiles = files.filter((f) =>
      /\.(jpe?g|png|webp|mp4|mov)$/i.test(f.name)
    );
    if (mediaFiles.length > 0) {
      setMode("images");
      setZipFile(null);
      setImageFiles((prev) => {
        const existing = new Set(prev.map((f) => f.name + f.size));
        const newFiles = mediaFiles.filter(
          (f) => !existing.has(f.name + f.size)
        );
        return [...prev, ...newFiles];
      });
      return;
    }

    setError(
      "Formato no soportado. Acepta: ZIP, JPG, PNG, WEBP, MP4, MOV"
    );
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) processDroppedFiles(files);
    // Reset so same file can be re-selected
    e.target.value = "";
  }

  function removeImage(index: number) {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    if (imageFiles.length <= 1) setMode(null);
  }

  function clearAll() {
    setMode(null);
    setZipFile(null);
    setImageFiles([]);
    setError("");
  }

  // ── Upload ──────────────────────────────────────────────────────

  async function handleUpload() {
    if (!hasFiles) return;
    setError("");
    setLoading(true);

    try {
      let fileToUpload: File;

      if (mode === "images") {
        // Package images into a ZIP with schedule metadata
        setProgress("Preparando tus archivos...");
        const zip = new JSZip();

        // Create a meta file with schedule preferences
        const schedule = {
          start_date: startDate,
          start_time: startTime,
          frequency,
          custom_hours: frequency === "custom" ? customHours : undefined,
        };
        zip.file("__schedule__.json", JSON.stringify(schedule));

        for (const img of imageFiles) {
          const buf = await img.arrayBuffer();
          zip.file(img.name, buf);
        }

        const zipBlob = await zip.generateAsync({ type: "blob" });
        fileToUpload = new File([zipBlob], "contenido.zip", {
          type: "application/zip",
        });
      } else {
        fileToUpload = zipFile!;
      }

      setProgress("Subiendo tu contenido...");
      const fd = new FormData();
      fd.append("file", fileToUpload);
      fd.append("businessSlug", slug);
      fd.append("startDate", startDate);
      fd.append("startTime", startTime);
      fd.append("frequency", frequency);
      if (frequency === "custom")
        fd.append("customHours", String(customHours));

      const res = await fetch("/api/batches", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) {
        setError(
          data.error ?? "No se pudo subir el archivo. Intentalo de nuevo."
        );
        setLoading(false);
        setProgress("");
        return;
      }
      setProgress("Procesando! Redirigiendo...");
      router.push(`/businesses/${slug}/batches/${data.data.batchId}`);
    } catch {
      setError("Error de red. Comprueba tu conexion.");
    } finally {
      setLoading(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Sube tu contenido
        </h1>
        <p className="text-slate-500 mt-1">
          Arrastra tus fotos, videos o un ZIP y AutoPost los programa por ti
        </p>
      </div>

      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
          hasFiles
            ? "border-pink-400 bg-pink-50"
            : "border-slate-300 hover:border-pink-300 bg-white"
        }`}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".zip,.jpg,.jpeg,.png,.webp,.mp4,.mov"
          multiple
          className="hidden"
          onChange={handleFileInput}
        />

        {mode === "zip" && zipFile ? (
          <div>
            <FileArchive className="h-12 w-12 text-pink-500 mx-auto mb-3" />
            <p className="font-semibold text-slate-800">{zipFile.name}</p>
            <p className="text-sm text-slate-400 mt-1">
              {(zipFile.size / 1024 / 1024).toFixed(1)} MB
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearAll();
              }}
              className="text-xs text-pink-500 mt-2 hover:text-pink-600"
            >
              Cambiar archivo
            </button>
          </div>
        ) : mode === "images" && imageFiles.length > 0 ? (
          <div onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-wrap gap-2 justify-center mb-3">
              {imageFiles.map((f, i) => (
                <div
                  key={`${f.name}-${i}`}
                  className="relative group"
                >
                  <div className="w-16 h-16 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                    {f.type.startsWith("image/") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={URL.createObjectURL(f)}
                        alt={f.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs text-slate-400">MP4</span>
                    )}
                  </div>
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => fileRef.current?.click()}
                className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:border-pink-300 hover:text-pink-400 transition-colors"
              >
                <Upload className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-slate-500">
              {imageFiles.length} archivo{imageFiles.length !== 1 ? "s" : ""}{" "}
              seleccionado{imageFiles.length !== 1 ? "s" : ""}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Cada imagen = 1 post. Arrastra mas o toca + para agregar.
            </p>
          </div>
        ) : (
          <div>
            <Upload className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-600">
              Arrastra tus fotos, videos o ZIP aqui
            </p>
            <p className="text-sm text-slate-400 mt-1">
              o toca para seleccionar archivos
            </p>
            <div className="flex items-center justify-center gap-3 mt-3">
              <span className="text-xs text-slate-300 bg-slate-50 px-2 py-1 rounded">
                JPG
              </span>
              <span className="text-xs text-slate-300 bg-slate-50 px-2 py-1 rounded">
                PNG
              </span>
              <span className="text-xs text-slate-300 bg-slate-50 px-2 py-1 rounded">
                MP4
              </span>
              <span className="text-xs text-slate-300 bg-slate-50 px-2 py-1 rounded">
                ZIP
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Schedule settings — only show when files are selected */}
      {hasFiles && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <p className="font-semibold text-slate-800 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-pink-500" />
            Programacion
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">
                Fecha de inicio
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">
                Hora de publicacion
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 block mb-2">
              Frecuencia
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFrequency("daily")}
                className={`flex-1 text-sm py-2 px-3 rounded-lg border transition-colors ${
                  frequency === "daily"
                    ? "border-pink-400 bg-pink-50 text-pink-700 font-medium"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                1 post al dia
              </button>
              <button
                type="button"
                onClick={() => setFrequency("custom")}
                className={`flex-1 text-sm py-2 px-3 rounded-lg border transition-colors ${
                  frequency === "custom"
                    ? "border-pink-400 bg-pink-50 text-pink-700 font-medium"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                Personalizado
              </button>
            </div>
          </div>

          {frequency === "custom" && (
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">
                Publicar cada (horas)
              </label>
              <input
                type="number"
                min={1}
                max={168}
                value={customHours}
                onChange={(e) =>
                  setCustomHours(Math.max(1, parseInt(e.target.value) || 24))
                }
                className="w-32 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
          )}

          <p className="text-xs text-slate-400">
            Puedes cambiar la fecha y hora de cada post despues de subirlo.
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {progress && (
        <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-700">
          {progress}
        </div>
      )}

      <div className="flex gap-3">
        <Button
          onClick={handleUpload}
          disabled={!hasFiles}
          loading={loading}
          className="flex-1 h-11"
        >
          <Upload className="h-4 w-4 mr-2" />
          {loading
            ? "Subiendo..."
            : mode === "images"
            ? `Subir ${imageFiles.length} post${imageFiles.length !== 1 ? "s" : ""}`
            : "Subir contenido"}
        </Button>
        <Button variant="outline" onClick={() => router.back()} className="h-11">
          Cancelar
        </Button>
      </div>

      {/* Help section */}
      <div className="bg-slate-50 rounded-xl border border-slate-200">
        <button
          type="button"
          onClick={() => setShowHelp(!showHelp)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-700"
        >
          <span className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-slate-400" />
            Como preparo mi contenido?
          </span>
          <span className="text-slate-400">{showHelp ? "^" : "v"}</span>
        </button>

        {showHelp && (
          <div className="px-4 pb-4 space-y-4 border-t border-slate-200 pt-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-sm font-bold text-green-800 mb-2">
                Lo mas facil: arrastra tus fotos
              </p>
              <p className="text-xs text-green-700">
                Arrastra tus fotos directamente a esta pagina. Cada foto sera un
                post. Tu eliges la fecha de inicio y la hora.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm font-bold text-blue-800 mb-2">
                Con texto: sube un ZIP con carpetas
              </p>
              <p className="text-xs text-blue-700 mb-3">
                Cada carpeta = un post. Mete las fotos y un archivo{" "}
                <code className="bg-blue-100 px-1 rounded">caption.txt</code>{" "}
                con el texto del post.
              </p>
              <div className="bg-white rounded-lg border border-blue-200 p-3">
                <pre className="text-xs text-slate-600 font-mono leading-relaxed">{`mis-posts.zip
  post-verano/
    foto.jpg
    caption.txt
  sorteo/
    imagen1.jpg
    imagen2.jpg
    caption.txt`}</pre>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <p className="text-xs text-amber-700">
                <strong>Formatos:</strong> JPG, PNG, WEBP para fotos · MP4, MOV
                para videos · Maximo 100MB total
              </p>
            </div>

            <a
              href="/api/batches/example"
              download
              className="inline-flex items-center gap-2 text-sm text-pink-500 hover:text-pink-600 font-medium"
            >
              <Download className="h-4 w-4" />
              Descargar ejemplo ZIP
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
