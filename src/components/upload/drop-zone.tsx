"use client";

import { useRef, useState } from "react";
import { Upload, FileArchive, FolderOpen, Loader2, FolderInput } from "lucide-react";
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

/**
 * Extract FileSystemEntry objects SYNCHRONOUSLY from the drop event.
 * This MUST happen in the same tick as the drop event — the browser
 * clears dataTransfer.items after the handler returns.
 */
function extractEntries(items: DataTransferItemList): FileSystemEntry[] {
  const entries: FileSystemEntry[] = [];
  for (let i = 0; i < items.length; i++) {
    const entry = items[i].webkitGetAsEntry?.();
    if (entry) entries.push(entry);
  }
  return entries;
}

/**
 * Read all files from already-extracted FileSystemEntry objects.
 * This can be called asynchronously since entries persist.
 */
async function readEntriesAsFiles(
  entries: FileSystemEntry[]
): Promise<{ files: File[]; folderName: string } | null> {
  // Single directory → treat as folder drop
  if (entries.length === 1 && entries[0].isDirectory) {
    const files = await readAllFiles(entries[0] as FileSystemDirectoryEntry, "");
    return files.length > 0
      ? { files, folderName: entries[0].name }
      : null;
  }

  // Multiple entries with at least one directory
  if (entries.some((e) => e.isDirectory)) {
    const allFiles: File[] = [];
    for (const entry of entries) {
      if (entry.isDirectory) {
        const files = await readAllFiles(
          entry as FileSystemDirectoryEntry,
          entry.name
        );
        allFiles.push(...files);
      } else {
        const file = await readFileEntry(entry as FileSystemFileEntry);
        if (file) allFiles.push(file);
      }
    }
    return allFiles.length > 0
      ? { files: allFiles, folderName: entries[0].name }
      : null;
  }

  return null; // Not a folder drop
}

async function readAllFiles(
  dirEntry: FileSystemDirectoryEntry,
  basePath: string
): Promise<File[]> {
  const files: File[] = [];
  const reader = dirEntry.createReader();

  // readEntries can return partial results, so we loop
  let batch: FileSystemEntry[];
  do {
    batch = await new Promise<FileSystemEntry[]>((resolve, reject) => {
      reader.readEntries(resolve, reject);
    });
    for (const entry of batch) {
      const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;
      if (shouldSkip(relativePath)) continue;

      if (entry.isFile) {
        const file = await readFileEntry(entry as FileSystemFileEntry);
        if (file) {
          // Attach relative path for ZIP structure
          Object.defineProperty(file, "relativePath", {
            value: relativePath,
            writable: false,
          });
          files.push(file);
        }
      } else if (entry.isDirectory) {
        const subFiles = await readAllFiles(
          entry as FileSystemDirectoryEntry,
          relativePath
        );
        files.push(...subFiles);
      }
    }
  } while (batch.length > 0);

  return files;
}

function readFileEntry(entry: FileSystemFileEntry): Promise<File | null> {
  return new Promise((resolve) => {
    entry.file(
      (f) => resolve(f),
      () => resolve(null)
    );
  });
}

/**
 * Compress a list of files into a ZIP blob, preserving relative paths.
 */
async function compressToZip(
  files: File[],
  folderName: string
): Promise<File> {
  const zip = new JSZip();

  for (const file of files) {
    const relativePath =
      (file as File & { relativePath?: string }).relativePath ?? file.name;
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

export function DropZone({ onFileSelected, disabled }: DropZoneProps) {
  const zipFileRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [compressInfo, setCompressInfo] = useState("");

  async function processFolder(files: File[], folderName: string) {
    setCompressing(true);
    setCompressInfo(
      `Comprimiendo ${files.length} archivo${files.length !== 1 ? "s" : ""}...`
    );
    try {
      const zipFile = await compressToZip(files, folderName);
      setSelectedFile(zipFile);
      setCompressing(false);
      setCompressInfo("");
      onFileSelected(zipFile);
    } catch {
      setCompressing(false);
      setCompressInfo("Error al comprimir la carpeta. Intentalo de nuevo.");
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (disabled || compressing) return;

    // ── SYNC: extract entries & files before browser clears dataTransfer ──
    const entries =
      e.dataTransfer.items && e.dataTransfer.items.length > 0
        ? extractEntries(e.dataTransfer.items)
        : [];
    const droppedFile = e.dataTransfer.files[0] ?? null;
    const hasDirectoryEntry = entries.some((ent) => ent.isDirectory);

    // ── ASYNC: now we can safely work with the captured entries ──
    if (hasDirectoryEntry && entries.length > 0) {
      // Folder was dropped — read its contents and compress
      (async () => {
        const result = await readEntriesAsFiles(entries);
        if (result && result.files.length > 0) {
          await processFolder(result.files, result.folderName);
        }
      })();
      return;
    }

    // Fallback: check for a ZIP file
    if (droppedFile) {
      if (
        droppedFile.name.endsWith(".zip") ||
        droppedFile.type === "application/zip" ||
        droppedFile.type === "application/x-zip-compressed"
      ) {
        setSelectedFile(droppedFile);
        onFileSelected(droppedFile);
      }
    }
  }

  function handleZipFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) {
      setSelectedFile(f);
      onFileSelected(f);
    }
  }

  async function handleFolderChange(e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const files: File[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      // webkitRelativePath gives us the relative path within the selected folder
      const relativePath =
        (file as File & { webkitRelativePath?: string }).webkitRelativePath ??
        file.name;
      if (shouldSkip(relativePath)) continue;

      // Attach relative path (remove the root folder name prefix for cleaner ZIP)
      const pathParts = relativePath.split("/");
      const innerPath =
        pathParts.length > 1 ? pathParts.slice(1).join("/") : file.name;
      Object.defineProperty(file, "relativePath", {
        value: innerPath,
        writable: false,
        configurable: true,
      });
      files.push(file);
    }

    if (files.length === 0) return;

    // Extract folder name from webkitRelativePath
    const firstPath =
      (fileList[0] as File & { webkitRelativePath?: string })
        .webkitRelativePath ?? "";
    const folderName = firstPath.split("/")[0] || "mis-posts";

    await processFolder(files, folderName);
  }

  // ─── Compressing state ────────────────────────────────────────────────

  if (compressing) {
    return (
      <div className="border-2 border-purple-300 bg-purple-50 rounded-2xl p-12 text-center">
        <Loader2 className="h-14 w-14 text-purple-500 mx-auto mb-4 animate-spin" />
        <p className="text-lg font-semibold text-slate-800">{compressInfo}</p>
        <p className="text-sm text-slate-400 mt-1">
          Esto solo tarda unos segundos.
        </p>
      </div>
    );
  }

  // ─── File selected state ──────────────────────────────────────────────

  if (selectedFile) {
    return (
      <div className="relative">
        <div
          className="border-2 border-pink-400 bg-pink-50 rounded-2xl p-8 text-center cursor-pointer transition-all hover:bg-pink-100"
          onClick={() => !disabled && zipFileRef.current?.click()}
        >
          <input
            ref={zipFileRef}
            type="file"
            accept=".zip"
            className="hidden"
            onChange={handleZipFileChange}
            disabled={disabled}
          />
          <FileArchive className="h-14 w-14 text-pink-500 mx-auto mb-4" />
          <p className="text-lg font-semibold text-slate-800">
            {selectedFile.name}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
          </p>
          <p className="text-xs text-pink-500 mt-3 font-medium">
            Toca para cambiar el archivo
          </p>
        </div>
      </div>
    );
  }

  // ─── Default empty state ──────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Main drop zone */}
      <div
        className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
          dragging
            ? "border-pink-400 bg-pink-50 scale-[1.02]"
            : "border-slate-200 hover:border-pink-300 bg-white hover:bg-slate-50"
        } ${disabled ? "opacity-50 pointer-events-none" : ""}`}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onClick={() => zipFileRef.current?.click()}
      >
        {/* Hidden inputs */}
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
          /* @ts-expect-error webkitdirectory is not in React types */
          webkitdirectory=""
          directory=""
          multiple
        />

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
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center mx-auto mb-5">
                <Upload className="h-10 w-10 text-pink-500" />
              </div>
              <p className="text-xl font-semibold text-slate-800">
                Arrastra aqui tu carpeta o ZIP con tus posts
              </p>
              <p className="text-slate-400 mt-2">
                No importa como lo tengas organizado. Nosotros lo ordenamos por
                ti.
              </p>
              <div className="mt-5 inline-flex items-center gap-2 text-sm text-pink-500 font-medium bg-pink-50 px-4 py-2 rounded-full">
                <Upload className="h-4 w-4" />
                Seleccionar ZIP
              </div>
              <p className="text-xs text-slate-300 mt-4">
                Formato: .zip o carpeta &middot; Maximo 100MB
              </p>
            </>
          )}
        </div>
      </div>

      {/* Folder selection button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          folderRef.current?.click();
        }}
        disabled={disabled}
        className="w-full flex items-center justify-center gap-3 border-2 border-dashed border-purple-200 hover:border-purple-400 bg-purple-50/50 hover:bg-purple-50 rounded-2xl p-5 transition-all group disabled:opacity-50 disabled:pointer-events-none"
      >
        <div className="w-10 h-10 rounded-full bg-purple-100 group-hover:bg-purple-200 flex items-center justify-center transition-colors">
          <FolderInput className="h-5 w-5 text-purple-500" />
        </div>
        <div className="text-left">
          <p className="text-sm font-semibold text-slate-700">
            Seleccionar una carpeta del ordenador
          </p>
          <p className="text-xs text-slate-400">
            La comprimimos automaticamente por ti. Sin necesidad de crear un ZIP.
          </p>
        </div>
      </button>

      {compressInfo && (
        <p className="text-xs text-red-500 text-center">{compressInfo}</p>
      )}
    </div>
  );
}
