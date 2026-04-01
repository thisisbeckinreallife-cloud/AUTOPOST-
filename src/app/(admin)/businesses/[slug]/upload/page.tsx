"use client";

import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Upload, FileArchive, HelpCircle, Download } from "lucide-react";

export default function UploadPage() {
  const { slug } = useParams() as { slug: string };
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");
  const [showHelp, setShowHelp] = useState(false);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped?.name.endsWith(".zip")) {
      setFile(dropped);
      setError("");
    } else {
      setError("El archivo debe ser un .zip");
    }
  }

  async function handleUpload() {
    if (!file) return;
    setError("");
    setLoading(true);
    setProgress("Subiendo tu contenido...");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("businessSlug", slug);
      const res = await fetch("/api/batches", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo subir el archivo. Inténtalo de nuevo.");
        setLoading(false);
        setProgress("");
        return;
      }
      setProgress("¡Procesando! Redirigiendo...");
      router.push(`/businesses/${slug}/batches/${data.data.batchId}`);
    } catch {
      setError("Error de red. Comprueba tu conexión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Sube el contenido del mes</h1>
        <p className="text-slate-500 mt-1">
          Sube una carpeta comprimida con todos tus posts y AutoPost los programará automáticamente
        </p>
      </div>

      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer ${
          file ? "border-pink-400 bg-pink-50" : "border-slate-300 hover:border-pink-300 bg-white"
        }`}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".zip"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) { setFile(f); setError(""); }
          }}
        />
        {file ? (
          <div>
            <FileArchive className="h-12 w-12 text-pink-500 mx-auto mb-3" />
            <p className="font-semibold text-slate-800">{file.name}</p>
            <p className="text-sm text-slate-400 mt-1">{(file.size / 1024 / 1024).toFixed(1)} MB · Listo para subir</p>
            <p className="text-xs text-pink-500 mt-2">Toca para cambiar el archivo</p>
          </div>
        ) : (
          <div>
            <Upload className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-600">Arrastra aquí tu carpeta del mes</p>
            <p className="text-sm text-slate-400 mt-1">o toca para seleccionar el archivo</p>
            <p className="text-xs text-slate-300 mt-2">Formato: .zip · Máximo 100MB</p>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          ⚠️ {error}
        </div>
      )}
      {progress && (
        <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-700">
          ⏳ {progress}
        </div>
      )}

      <div className="flex gap-3">
        <Button onClick={handleUpload} disabled={!file} loading={loading} className="flex-1 h-11">
          <Upload className="h-4 w-4 mr-2" />
          {loading ? "Subiendo..." : "Subir contenido"}
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
            ¿Cómo debo preparar mi carpeta?
          </span>
          <span className="text-slate-400">{showHelp ? "▲" : "▼"}</span>
        </button>

        {showHelp && (
          <div className="px-4 pb-4 space-y-4 border-t border-slate-200 pt-4">
            <p className="text-sm text-slate-600">
              Crea una carpeta por cada post. Cada carpeta debe contener:
            </p>
            <div className="space-y-2">
              <HelpItem icon="🖼️" title="Tu foto o vídeo" desc="Formatos: JPG, PNG, MP4" />
              <HelpItem icon="✏️" title="El texto del post" desc="Un archivo llamado caption.txt con el texto que quieres publicar" />
              <HelpItem icon="📅" title="La fecha de publicación" desc="En el nombre de la carpeta: YYYY-MM-DD_nombre-del-post" />
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-3">
              <p className="text-xs font-semibold text-slate-500 mb-2">Ejemplo de estructura:</p>
              <pre className="text-xs text-slate-600 font-mono leading-relaxed">{`mis-posts-abril/
  2026-04-15_post-verano/
    foto.jpg
    caption.txt
  2026-04-20_sorteo/
    imagen.jpg
    caption.txt`}</pre>
            </div>
            <a
              href="/api/batches/example"
              download
              className="inline-flex items-center gap-2 text-sm text-pink-500 hover:text-pink-600 font-medium"
            >
              <Download className="h-4 w-4" />
              Descargar carpeta de ejemplo
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function HelpItem({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-lg">{icon}</span>
      <div>
        <p className="text-sm font-medium text-slate-700">{title}</p>
        <p className="text-xs text-slate-400">{desc}</p>
      </div>
    </div>
  );
}
