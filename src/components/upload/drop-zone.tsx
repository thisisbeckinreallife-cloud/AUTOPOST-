"use client";

import { useRef, useState, useCallback } from "react";
import {
  Upload,
  FileArchive,
  FolderOpen,
  Loader2,
  FolderInput,
  AlertCircle,
  FileUp,
  Film,
} from "lucide-react";
import JSZip from "jszip";

const MEDIA_EXTENSIONS = new Set([
  ".jpg", ".jpeg", ".png", ".webp", ".mp4", ".mov",
]);

function isMediaFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return [...MEDIA_EXTENSIONS].some((ext) => name.endsWith(ext));
}

interface DropZoneProps {
  onFileSelected: (file: File) => void;
  onDirectMediaSelected?: (files: File[]) => void;
  disabled?: boolean;
}

/** System/junk files to skip when compressing a folder */
const SKIP_NAMES = new Set([".ds_store", "thumbs.db", "desktop.ini", ".gitkeep"]);
const SKIP_PREFIXES = ["__macosx", "._", ".git"];

function shouldSkip(path: string): boolean {
  const lower = path.toLowerCase();
  const parts = lower.split("/");
  return parts.some(
    (p) =>
      SKIP_NAMES.has(p) ||
      SKIP_PREFIXES.some((prefix) => p.startsWith(prefix))
  );
}

// ─── File System Entries API helpers ────────────────────────────────────────

function readDirectoryEntries(
  reader: FileSystemDirectoryReader
): Promise<FileSystemEntry[]> {
  return new Promise((resolve, reject) => {
    reader.readEntries(
      (entries) => resolve(entries),
      (err) => reject(err)
    );
  });
}

function fileEntryToFile(entry: FileSystemFileEntry): Promise<File> {
  return new Promise((resolve, reject) => {
    entry.file(
      (f) => resolve(f),
      (err) => reject(err)
    );
  });
}

async function readDirectoryRecursive(
  dirEntry: FileSystemDirectoryEntry,
  basePath: string
): Promise<File[]> {
  const files: File[] = [];
  const reader = dirEntry.createReader();

  let hasMore = true;
  while (hasMore) {
    const batch = await readDirectoryEntries(reader);
    if (batch.length === 0) {
      hasMore = false;
      break;
    }
    for (const entry of batch) {
      const entryPath = basePath ? `${basePath}/${entry.name}` : entry.name;
      if (shouldSkip(entryPath)) continue;

      if (entry.isFile) {
        try {
          const file = await fileEntryToFile(entry as FileSystemFileEntry);
          (file as File & { _relativePath: string })._relativePath = entryPath;
          files.push(file);
        } catch {
          // Skip unreadable files
        }
      } else if (entry.isDirectory) {
        const subFiles = await readDirectoryRecursive(
          entry as FileSystemDirectoryEntry,
          entryPath
        );
        files.push(...subFiles);
      }
    }
  }

  return files;
}

// ─── ZIP compression ────────────────────────────────────────────────────────

async function compressToZip(files: File[], folderName: string): Promise<File> {
  const zip = new JSZip();

  for (const file of files) {
    const relativePath =
      (file as File & { _relativePath?: string })._relativePath ?? file.name;
    if (shouldSkip(relativePath)) continue;

    const data = await file.arrayBuffer();
    zip.file(relativePath, data);
  }

  const blob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  const safeName = folderName
    .replace(/[^a-zA-Z0-9_\-]/g, "_")
    .substring(0, 50);
  return new File([blob], `${safeName || "mis-posts"}.zip`, {
    type: "application/zip",
  });
}

// ─── Component ──────────────────────────────────────────────────────────────

export function DropZone({ onFileSelected, onDirectMediaSelected, disabled }: DropZoneProps) {
  const zipFileRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);
  const mediaFileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [compressInfo, setCompressInfo] = useState("");
  const [error, setError] = useState("");

  const processFolder = useCallback(
    async (files: File[], folderName: string) => {
      if (files.length === 0) {
        setError("La carpeta esta vacia o no tiene archivos compatibles.");
        setCompressing(false);
        setCompressInfo("");
        return;
      }
      setCompressing(true);
      setError("");
      setCompressInfo(
        `Comprimiendo ${files.length} archivo${files.length !== 1 ? "s" : ""}...`
      );
      try {
        const zipFile = await compressToZip(files, folderName);
        setSelectedFile(zipFile);
        setCompressing(false);
        setCompressInfo("");
        onFileSelected(zipFile);
      } catch (err) {
        console.error("Error compressing folder:", err);
        setCompressing(false);
        setCompressInfo("");
        setError("Error al comprimir la carpeta. Intentalo de nuevo.");
      }
    },
    [onFileSelected]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(false);
      if (disabled || compressing) return;
      setError("");

      let directoryEntry: FileSystemDirectoryEntry | null = null;
      let zipFile: File | null = null;

      if (e.dataTransfer.items) {
        for (let i = 0; i < e.dataTransfer.items.length; i++) {
          const item = e.dataTransfer.items[i];
          if (item.kind !== "file") continue;

          const entry = item.webkitGetAsEntry?.();

          if (entry && entry.isDirectory) {
            directoryEntry = entry as FileSystemDirectoryEntry;
            break;
          }

          if (!entry || entry.isFile) {
            const file = item.getAsFile();
            if (
              file &&
              (file.name.toLowerCase().endsWith(".zip") ||
                file.type === "application/zip" ||
                file.type === "application/x-zip-compressed")
            ) {
              zipFile = file;
            }
          }
        }
      }

      if (!directoryEntry && !zipFile && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (
          file.name.toLowerCase().endsWith(".zip") ||
          file.type === "application/zip" ||
          file.type === "application/x-zip-compressed"
        ) {
          zipFile = file;
        }
      }

      if (directoryEntry) {
        const folderName = directoryEntry.name;
        const dirRef = directoryEntry;

        setCompressing(true);
        setCompressInfo("Leyendo carpeta...");

        readDirectoryRecursive(dirRef, "")
          .then((files) => {
            if (files.length === 0) {
              setCompressing(false);
              setCompressInfo("");
              setError("La carpeta no tiene archivos compatibles.");
              return;
            }
            return processFolder(files, folderName);
          })
          .catch((err) => {
            console.error("Error reading dropped folder:", err);
            setCompressing(false);
            setCompressInfo("");
            setError(
              'No pudimos leer la carpeta. Usa el boton "Seleccionar carpeta" de abajo.'
            );
          });
        return;
      }

      if (zipFile) {
        setSelectedFile(zipFile);
        onFileSelected(zipFile);
        return;
      }

      // Check for direct media files (photos/videos)
      if (e.dataTransfer.files.length > 0 && onDirectMediaSelected) {
        const mediaFiles: File[] = [];
        for (let i = 0; i < e.dataTransfer.files.length; i++) {
          const f = e.dataTransfer.files[i];
          if (isMediaFile(f)) mediaFiles.push(f);
        }
        if (mediaFiles.length > 0) {
          setSelectedFile(mediaFiles[0]);
          onDirectMediaSelected(mediaFiles);
          return;
        }
      }

      if (e.dataTransfer.files.length > 0) {
        const f = e.dataTransfer.files[0];
        if (f.size === 0 && f.type === "") {
          setError(
            'Tu navegador no soporta arrastrar carpetas. Usa el boton "Seleccionar carpeta" de abajo.'
          );
          return;
        }
      }

      setError("Solo puedes subir archivos ZIP, carpetas, fotos o videos.");
    },
    [disabled, compressing, onFileSelected, processFolder]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled && !compressing) setDragging(true);
    },
    [disabled, compressing]
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(false);
    },
    []
  );

  function handleZipFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) {
      setError("");
      setSelectedFile(f);
      onFileSelected(f);
    }
  }

  function handleMediaFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    setError("");

    const files: File[] = [];
    for (let i = 0; i < fileList.length; i++) {
      if (isMediaFile(fileList[i])) files.push(fileList[i]);
    }
    if (files.length === 0) {
      setError("No se encontraron fotos o videos compatibles.");
      return;
    }
    setSelectedFile(files[0]);
    onDirectMediaSelected?.(files);
  }

  async function handleFolderChange(e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    setError("");

    let hasSubfolders = false;
    for (let i = 0; i < fileList.length; i++) {
      const rp = fileList[i].webkitRelativePath || "";
      if (rp.split("/").length > 2) {
        hasSubfolders = true;
        break;
      }
    }

    const files: File[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const relativePath = file.webkitRelativePath || file.name;
      if (shouldSkip(relativePath)) continue;

      let innerPath: string;
      if (hasSubfolders) {
        const pathParts = relativePath.split("/");
        innerPath = pathParts.length > 1 ? pathParts.slice(1).join("/") : file.name;
      } else {
        innerPath = relativePath;
      }

      (file as File & { _relativePath: string })._relativePath = innerPath;
      files.push(file);
    }

    if (files.length === 0) {
      setError("La carpeta esta vacia o no tiene archivos compatibles.");
      return;
    }

    const folderName =
      (fileList[0].webkitRelativePath || "").split("/")[0] || "mis-posts";
    await processFolder(files, folderName);
  }

  const hiddenInputs = (
    <>
      <input
        ref={zipFileRef}
        type="file"
        accept=".zip"
        className="hidden"
        onChange={handleZipFileChange}
        disabled={disabled}
      />
      <input
        ref={folderRef}
        type="file"
        className="hidden"
        onChange={handleFolderChange}
        disabled={disabled}
        // @ts-expect-error webkitdirectory is a non-standard attribute
        webkitdirectory=""
        directory=""
        multiple
      />
      <input
        ref={mediaFileRef}
        type="file"
        accept=".mp4,.mov,.jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={handleMediaFileChange}
        disabled={disabled}
        multiple
      />
    </>
  );

  // Compressing state
  if (compressing) {
    return (
      <>
        {hiddenInputs}
        <div className="border border-brand-500/20 bg-brand-500/[0.04] rounded-2xl p-12 text-center">
          <Loader2 className="h-10 w-10 text-brand-400 mx-auto mb-4 animate-spin" />
          <p className="text-base font-semibold text-zinc-200">{compressInfo}</p>
          <p className="text-sm text-zinc-500 mt-1">Esto solo tarda unos segundos.</p>
        </div>
      </>
    );
  }

  // File selected state
  if (selectedFile) {
    return (
      <>
        {hiddenInputs}
        <div
          className="border border-brand-500/20 bg-brand-500/[0.04] rounded-2xl p-8 text-center cursor-pointer transition-all hover:bg-brand-500/[0.06]"
          onClick={() => !disabled && folderRef.current?.click()}
        >
          <FileArchive className="h-10 w-10 text-brand-400 mx-auto mb-3" />
          <p className="text-base font-semibold text-zinc-200">{selectedFile.name}</p>
          <p className="text-sm text-zinc-500 mt-1">{(selectedFile.size / 1024 / 1024).toFixed(1)} MB</p>
          <p className="text-xs text-brand-400 mt-3 font-medium">Toca para cambiar</p>
        </div>
      </>
    );
  }

  // Default empty state
  return (
    <>
      {hiddenInputs}
      <div className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 bg-red-500/8 border border-red-500/15 rounded-xl px-4 py-3">
            <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Drop zone */}
        <div
          className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all ${
            dragging
              ? "border-brand-500/40 bg-brand-500/[0.04] scale-[1.01]"
              : "border-white/[0.08] bg-surface-card"
          } ${disabled ? "opacity-50 pointer-events-none" : ""}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="max-w-sm mx-auto">
            {dragging ? (
              <>
                <FolderOpen className="h-12 w-12 text-brand-400 mx-auto mb-4" />
                <p className="text-lg font-semibold text-brand-400">
                  Suelta aqui tu carpeta, ZIP, video o foto
                </p>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-xl bg-brand-500/8 border border-brand-500/10 flex items-center justify-center mx-auto mb-4">
                  <Upload className="h-7 w-7 text-brand-400" />
                </div>
                <p className="text-base font-semibold text-zinc-200">
                  Arrastra aqui tu contenido
                </p>
                <p className="text-sm text-zinc-500 mt-1">
                  No importa como lo tengas organizado. Nosotros lo ordenamos por ti.
                </p>
              </>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => mediaFileRef.current?.click()}
            disabled={disabled || !onDirectMediaSelected}
            className="flex items-center gap-3 border border-brand-500/20 hover:border-brand-500/40 bg-brand-500/[0.04] hover:bg-brand-500/[0.06] rounded-xl p-4 transition-all text-left group disabled:opacity-50 disabled:pointer-events-none"
          >
            <div className="w-10 h-10 rounded-lg bg-brand-500/10 group-hover:bg-brand-500/15 flex items-center justify-center shrink-0 transition-colors">
              <Film className="h-5 w-5 text-brand-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-brand-300">Subir video o foto</p>
              <p className="text-xs text-brand-400/60 mt-0.5">Reel, imagen o carousel</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => folderRef.current?.click()}
            disabled={disabled}
            className="flex items-center gap-3 border border-white/[0.06] hover:border-white/[0.1] bg-surface-card hover:bg-surface-hover rounded-xl p-4 transition-all text-left group disabled:opacity-50 disabled:pointer-events-none"
          >
            <div className="w-10 h-10 rounded-lg bg-zinc-800 group-hover:bg-zinc-700 flex items-center justify-center shrink-0 transition-colors">
              <FolderInput className="h-5 w-5 text-zinc-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-300">Seleccionar carpeta</p>
              <p className="text-xs text-zinc-500 mt-0.5">La comprimimos por ti</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => zipFileRef.current?.click()}
            disabled={disabled}
            className="flex items-center gap-3 border border-white/[0.06] hover:border-white/[0.1] bg-surface-card hover:bg-surface-hover rounded-xl p-4 transition-all text-left group disabled:opacity-50 disabled:pointer-events-none"
          >
            <div className="w-10 h-10 rounded-lg bg-zinc-800 group-hover:bg-zinc-700 flex items-center justify-center shrink-0 transition-colors">
              <FileUp className="h-5 w-5 text-zinc-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-300">Seleccionar ZIP</p>
              <p className="text-xs text-zinc-500 mt-0.5">Si ya tienes un .zip listo</p>
            </div>
          </button>
        </div>

        <p className="text-xs text-zinc-500 text-center">
          Fotos: JPG, PNG, WEBP &middot; Videos: MP4, MOV &middot; Maximo 100MB
        </p>
      </div>
    </>
  );
}
