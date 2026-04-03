"use client";

import { useState } from "react";
import Image from "next/image";
import { getImageUrl } from "@/lib/utils/image";

interface ImageGalleryProps {
  images: string[];
  name: string;
}

export function ImageGallery({ images, name }: ImageGalleryProps) {
  const [selected, setSelected] = useState(0);

  if (images.length === 0) {
    return (
      <div className="aspect-square bg-brand-cream rounded-2xl flex items-center justify-center">
        <span className="text-brand-brown text-sm">Sin imágenes</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-square bg-brand-cream rounded-2xl overflow-hidden">
        <Image
          src={getImageUrl(images[selected], 1200, 85)}
          alt={name}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-contain"
          priority
        />
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelected(i)}
              className={`relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors bg-brand-cream ${
                i === selected
                  ? "border-brand-orange"
                  : "border-transparent hover:border-brand-sand"
              }`}
            >
              <Image
                src={getImageUrl(img, 128)}
                alt={`${name} ${i + 1}`}
                fill
                sizes="64px"
                className="object-contain"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
