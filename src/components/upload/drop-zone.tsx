"use client";

import { useRef, useState } from "react";
import { Upload, FileArchive, FolderOpen } from "lucide-react";

interface DropZoneProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

export function DropZone({ onFileSelected, disabled }: DropZoneProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;

    const items = e.dataTransfer.items;
    const files = e.dataTransfer.files;

    // Try to get the first zip file
    const file = files[0];
    if (file) {
      if (file.name.endsWith(".zip") || file.type === "application/zip" || file.type === "application/x-zip-compressed") {
        setSelectedFile(file);
        onFileSelected(file);
      }
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) {
      setSelectedFile(f);
      onFileSelected(f);
    }
  }

  if (selectedFile) {
    return (
      <div className="relative">
        <div
          className="border-2 border-pink-400 bg-pink-50 rounded-2xl p-8 text-center cursor-pointer transition-all hover:bg-pink-100"
          onClick={() => !disabled && fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".zip"
            className="hidden"
            onChange={handleFileChange}
            disabled={disabled}
          />
          <FileArchive className="h-14 w-14 text-pink-500 mx-auto mb-4" />
          <p className="text-lg font-semibold text-slate-800">{selectedFile.name}</p>
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

  return (
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
      onClick={() => fileRef.current?.click()}
    >
      <input
        ref={fileRef}
        type="file"
        accept=".zip"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled}
      />

      <div className="max-w-sm mx-auto">
        {dragging ? (
          <>
            <FolderOpen className="h-16 w-16 text-pink-400 mx-auto mb-4 animate-bounce" />
            <p className="text-xl font-semibold text-pink-600">Suelta aqui</p>
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
              No importa como lo tengas organizado. Nosotros lo ordenamos por ti.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 text-sm text-pink-500 font-medium bg-pink-50 px-4 py-2 rounded-full">
              <Upload className="h-4 w-4" />
              O haz clic para seleccionar
            </div>
            <p className="text-xs text-slate-300 mt-4">
              Formato: .zip &middot; Maximo 100MB
            </p>
          </>
        )}
      </div>
    </div>
  );
}
