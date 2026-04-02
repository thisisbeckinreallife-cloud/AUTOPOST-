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
} from "lucide-react";
import JSZip from "jszip";

interface DropZoneProps {
  onFileSelected: (file: File) => void;
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

export function DropZone({ onFileSelected, disabled }: DropZoneProps) {
  const zipFileRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [compressInfo, setCompressInfo] = useState("");
  const [error, setError] = useState("");

  // ─── Process folder into ZIP ──────────────────────────────────────────

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

  // ─── Drop handler ─────────────────────────────────────────────────────

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(false);
      if (disabled || compressing) return;
      setError("");

      // SYNC: extract all entries and files immediately
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

      // ASYNC: process
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

      // Detect folder drop in unsupported browser
      if (e.dataTransfer.files.length > 0) {
        const f = e.dataTransfer.files[0];
        if (f.size === 0 && f.type === "") {
          setError(
            'Tu navegador no soporta arrastrar carpetas. Usa el boton "Seleccionar carpeta" de abajo.'
          );
          return;
        }
      }

      setError("Solo puedes subir archivos ZIP o carpetas con fotos/videos.");
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

  // ─── Input handlers ───────────────────────────────────────────────────

  function handleZipFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) {
      setError("");
      setSelectedFile(f);
      onFileSelected(f);
    }
  }

  async function handleFolderChange(e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    setError("");

    const files: File[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const relativePath = file.webkitRelativePath || file.name;
      if (shouldSkip(relativePath)) continue;

      const pathParts = relativePath.split("/");
      const innerPath =
        pathParts.length > 1 ? pathParts.slice(1).join("/") : file.name;
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

  // ─── Hidden inputs (always rendered) ──────────────────────────────────

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
    </>
  );

  // ─── Render: compressing ──────────────────────────────────────────────

  if (compressing) {
    return (
      <>
        {hiddenInputs}
        <div className="border-2 border-purple-300 bg-purple-50 rounded-2xl p-12 text-center">
          <Loader2 className="h-14 w-14 text-purple-500 mx-auto mb-4 animate-spin" />
          <p className="text-lg font-semibold text-slate-800">{compressInfo}</p>
          <p className="text-sm text-slate-400 mt-1">
            Esto solo tarda unos segundos.
          </p>
        </div>
      </>
    );
  }

  // ─── Render: file selected ────────────────────────────────────────────

  if (selectedFile) {
    return (
      <>
        {hiddenInputs}
        <div
          className="border-2 border-pink-400 bg-pink-50 rounded-2xl p-8 text-center cursor-pointer transition-all hover:bg-pink-100"
          onClick={() => !disabled && folderRef.current?.click()}
        >
          <FileArchive className="h-14 w-14 text-pink-500 mx-auto mb-4" />
          <p className="text-lg font-semibold text-slate-800">
            {selectedFile.name}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
          </p>
          <p className="text-xs text-pink-500 mt-3 font-medium">
            Toca para cambiar
          </p>
        </div>
      </>
    );
  }

  // ─── Render: default (empty) ──────────────────────────────────────────

  return (
    <>
      {hiddenInputs}
      <div className="space-y-4">
        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Drag & drop zone — NO onClick, only for dragging */}
        <div
          className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all ${
            dragging
              ? "border-pink-400 bg-pink-50 scale-[1.02]"
              : "border-slate-200 bg-white"
          } ${disabled ? "opacity-50 pointer-events-none" : ""}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="max-w-sm mx-auto">
            {dragging ? (
              <>
                <FolderOpen className="h-16 w-16 text-pink-400 mx-auto mb-4 animate-bounce" />
                <p className="text-xl font-semibold text-pink-600">
                  Suelta aqui tu carpeta o ZIP
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center mx-auto mb-4">
                  <Upload className="h-8 w-8 text-pink-500" />
                </div>
                <p className="text-lg font-semibold text-slate-800">
                  Arrastra aqui tu carpeta o ZIP
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  No importa como lo tengas organizado. Nosotros lo ordenamos
                  por ti.
                </p>
              </>
            )}
          </div>
        </div>

        {/* ── Two clear action buttons ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Folder button — PRIMARY action */}
          <button
            type="button"
            onClick={() => folderRef.current?.click()}
            disabled={disabled}
            className="flex items-center gap-3 border-2 border-purple-300 hover:border-purple-500 bg-purple-50 hover:bg-purple-100 rounded-xl p-4 transition-all text-left group disabled:opacity-50 disabled:pointer-events-none"
          >
            <div className="w-11 h-11 rounded-full bg-purple-200 group-hover:bg-purple-300 flex items-center justify-center shrink-0 transition-colors">
              <FolderInput className="h-5 w-5 text-purple-700" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-purple-800">
                Seleccionar carpeta
              </p>
              <p className="text-xs text-purple-600/70 mt-0.5">
                La comprimimos por ti
              </p>
            </div>
          </button>

          {/* ZIP button — secondary */}
          <button
            type="button"
            onClick={() => zipFileRef.current?.click()}
            disabled={disabled}
            className="flex items-center gap-3 border-2 border-slate-200 hover:border-pink-400 bg-white hover:bg-pink-50 rounded-xl p-4 transition-all text-left group disabled:opacity-50 disabled:pointer-events-none"
          >
            <div className="w-11 h-11 rounded-full bg-slate-100 group-hover:bg-pink-100 flex items-center justify-center shrink-0 transition-colors">
              <FileUp className="h-5 w-5 text-slate-500 group-hover:text-pink-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-700 group-hover:text-pink-700">
                Seleccionar ZIP
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Si ya tienes un .zip listo
              </p>
            </div>
          </button>
        </div>

        <p className="text-xs text-slate-300 text-center">
          Fotos: JPG, PNG, WEBP &middot; Videos: MP4, MOV &middot; Maximo 100MB
        </p>
      </div>
    </>
  );
}
