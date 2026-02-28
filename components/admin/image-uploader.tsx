"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { X, ImagePlus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  folder: string;
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_MB = 5;

export function ImageUploader({
  folder,
  images,
  onChange,
  maxImages = 5,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList) {
    const toUpload = Array.from(files).slice(0, maxImages - images.length);
    if (toUpload.length === 0) return;

    for (const file of toUpload) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError("Solo se aceptan imágenes JPEG, PNG o WebP.");
        return;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setError(`El archivo "${file.name}" supera los ${MAX_SIZE_MB}MB.`);
        return;
      }
    }

    setError(null);
    setUploading(true);

    try {
      const supabase = createClient();
      const uploadedUrls: string[] = [];

      for (const file of toUpload) {
        const ext = file.name.split(".").pop();
        const path = `${folder}/${crypto.randomUUID()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("images")
          .upload(path, file, { cacheControl: "3600", upsert: false });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from("images").getPublicUrl(path);
        uploadedUrls.push(data.publicUrl);
      }

      onChange([...images, ...uploadedUrls]);
    } catch (err) {
      setError("Error al subir la imagen. Intentá de nuevo.");
      console.error(err);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleRemove(url: string) {
    onChange(images.filter((img) => img !== url));
  }

  const canAdd = images.length < maxImages && !uploading;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {images.map((url) => (
          <div key={url} className="relative w-20 h-20 rounded-md overflow-hidden border border-gray-200 group">
            <Image src={url} alt="" fill className="object-cover" sizes="80px" />
            <button
              type="button"
              onClick={() => handleRemove(url)}
              className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {canAdd && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={cn(
              "w-20 h-20 rounded-md border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors"
            )}
          >
            <ImagePlus className="h-5 w-5" />
            <span className="text-xs">Agregar</span>
          </button>
        )}

        {uploading && (
          <div className="w-20 h-20 rounded-md border border-gray-200 flex items-center justify-center bg-gray-50">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
      {images.length >= maxImages && (
        <p className="text-xs text-gray-400">Máximo {maxImages} imágenes.</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />
    </div>
  );
}
