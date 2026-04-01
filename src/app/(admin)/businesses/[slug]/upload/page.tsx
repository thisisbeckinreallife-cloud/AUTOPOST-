"use client";

import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileArchive, Info } from "lucide-react";

export default function UploadPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped?.name.endsWith(".zip")) {
      setFile(dropped);
      setError("");
    } else {
      setError("Please drop a .zip file");
    }
  }

  async function handleUpload() {
    if (!file) return;
    setError("");
    setLoading(true);
    setProgress("Uploading ZIP...");

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("businessSlug", slug);

      const res = await fetch("/api/batches", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Upload failed");
        setLoading(false);
        setProgress("");
        return;
      }

      setProgress("Processing... redirecting to batch view");
      router.push(
        `/businesses/${slug}/batches/${data.data.batchId}`
      );
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Upload ZIP</h1>
        <p className="text-slate-500 mt-1">
          Import a month&apos;s worth of posts from a ZIP archive
        </p>
      </div>

      {/* Structure guide */}
      <Card className="mb-6 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2 text-blue-800">
            <Info className="h-4 w-4" />
            Expected ZIP Structure
          </CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs text-blue-700 font-mono leading-relaxed">
{`/2026-04/
  /2026-04-15_post-01/
    caption.txt
    meta.json
    media-01.jpg
  /2026-04-20_post-02/
    caption.txt
    meta.json
    media-01.jpg
    media-02.jpg
  /2026-04-25_reel-01/
    caption.txt
    meta.json
    reel.mp4`}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              file
                ? "border-brand-500 bg-brand-50"
                : "border-slate-300 hover:border-slate-400"
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
            style={{ cursor: "pointer" }}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".zip"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setFile(f);
                  setError("");
                }
              }}
            />
            {file ? (
              <div>
                <FileArchive className="h-10 w-10 text-brand-500 mx-auto mb-2" />
                <p className="font-medium text-brand-700">{file.name}</p>
                <p className="text-sm text-slate-500">
                  {(file.size / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
            ) : (
              <div>
                <Upload className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">
                  Drop ZIP here or click to select
                </p>
                <p className="text-xs text-slate-400 mt-1">Max 100MB</p>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {progress && (
            <div className="mt-4 rounded-md bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-700">
              {progress}
            </div>
          )}

          <div className="mt-4 flex gap-3">
            <Button
              onClick={handleUpload}
              disabled={!file}
              loading={loading}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload & Parse
            </Button>
            <Button
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
