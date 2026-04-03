"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import imageCompression from "browser-image-compression";
import { Loader2, CheckCircle2, XCircle, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.8,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
};

interface FileResult {
  path: string;
  originalKB: number;
  compressedKB: number;
  status: "ok" | "error" | "skipped";
  error?: string;
}

export default function AdminMediaPage() {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<FileResult[]>([]);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  async function runRecompression() {
    setRunning(true);
    setResults([]);
    setProgress({ done: 0, total: 0 });

    const supabase = createClient();
    const allFiles: string[] = [];
    const folders = ["products", "sets", "variations", "collections"];

    for (const folder of folders) {
      const { data, error } = await supabase.storage.from("images").list(folder, { limit: 1000 });
      if (error || !data) continue;
      for (const file of data) {
        if (file.name && file.metadata) {
          allFiles.push(`${folder}/${file.name}`);
        }
      }
    }

    setProgress({ done: 0, total: allFiles.length });

    const newResults: FileResult[] = [];

    for (const path of allFiles) {
      const { data: urlData } = supabase.storage.from("images").getPublicUrl(path);

      try {
        const response = await fetch(urlData.publicUrl);
        const blob = await response.blob();
        const originalKB = Math.round(blob.size / 1024);

        if (blob.size <= 200 * 1024) {
          newResults.push({ path, originalKB, compressedKB: originalKB, status: "skipped" });
          setResults([...newResults]);
          setProgress((p) => ({ ...p, done: p.done + 1 }));
          continue;
        }

        const file = new File([blob], path.split("/").pop() ?? "image.jpg", { type: "image/jpeg" });
        const compressed = await imageCompression(file, COMPRESSION_OPTIONS);
        const compressedKB = Math.round(compressed.size / 1024);

        const fd = new FormData();
        fd.append("path", path);
        fd.append("file", compressed, "image.jpg");

        const uploadRes = await fetch("/api/admin/recompress", { method: "POST", body: fd });
        if (!uploadRes.ok) {
          const json = await uploadRes.json();
          throw new Error(json.error ?? "Error al subir");
        }

        newResults.push({ path, originalKB, compressedKB, status: "ok" });
      } catch (err) {
        newResults.push({
          path,
          originalKB: 0,
          compressedKB: 0,
          status: "error",
          error: err instanceof Error ? err.message : "Error desconocido",
        });
      }

      setResults([...newResults]);
      setProgress((p) => ({ ...p, done: p.done + 1 }));
    }

    setRunning(false);
  }

  const ok = results.filter((r) => r.status === "ok");
  const skipped = results.filter((r) => r.status === "skipped");
  const errors = results.filter((r) => r.status === "error");
  const savedKB = ok.reduce((acc, r) => acc + (r.originalKB - r.compressedKB), 0);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Re-comprimir imágenes</h1>
        <p className="text-sm text-gray-500 mt-1">
          Descarga, comprime (máx. 800 KB / 1920px) y re-sube todas las imágenes del bucket. Las imágenes menores a 200 KB se omiten.
        </p>
      </div>

      <Button onClick={runRecompression} disabled={running} className="gap-2">
        {running ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Procesando {progress.done} / {progress.total}...
          </>
        ) : (
          <>
            <ImageIcon className="h-4 w-4" />
            Iniciar re-compresión
          </>
        )}
      </Button>

      {results.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg border border-green-200 bg-green-50 p-3">
              <p className="text-2xl font-bold text-green-700">{ok.length}</p>
              <p className="text-xs text-green-600">Comprimidas</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <p className="text-2xl font-bold text-gray-600">{skipped.length}</p>
              <p className="text-xs text-gray-500">Omitidas (ya OK)</p>
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-2xl font-bold text-red-600">{errors.length}</p>
              <p className="text-xs text-red-500">Errores</p>
            </div>
          </div>

          {ok.length > 0 && (
            <p className="text-sm font-medium text-green-700">
              Ahorro total: {savedKB >= 1024 ? `${(savedKB / 1024).toFixed(1)} MB` : `${savedKB} KB`}
            </p>
          )}

          <ul className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden text-sm max-h-96 overflow-y-auto">
            {results.map((r) => (
              <li key={r.path} className="flex items-center gap-3 px-4 py-2">
                {r.status === "ok" && <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />}
                {r.status === "skipped" && <CheckCircle2 className="h-4 w-4 text-gray-300 flex-shrink-0" />}
                {r.status === "error" && <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />}
                <span className="flex-1 truncate text-gray-700">{r.path}</span>
                {r.status === "ok" && (
                  <span className="text-xs text-gray-400 flex-shrink-0">{r.originalKB} KB → {r.compressedKB} KB</span>
                )}
                {r.status === "skipped" && (
                  <span className="text-xs text-gray-400 flex-shrink-0">{r.originalKB} KB — omitida</span>
                )}
                {r.status === "error" && (
                  <span className="text-xs text-red-500 flex-shrink-0">{r.error}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
