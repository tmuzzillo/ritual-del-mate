"use client";

import { useState } from "react";
import { ImageGallery } from "@/components/shop/image-gallery";
import { VariationSelector } from "@/components/shop/variation-selector";
import type { ProductVariation } from "@/types";

interface ProductDetailClientProps {
  images: string[];
  name: string;
  variations: ProductVariation[];
}

export function ProductDetailClient({ images, name, variations }: ProductDetailClientProps) {
  const [selectedVariationId, setSelectedVariationId] = useState<string | null>(null);

  const selectedVariation = variations.find((v) => v.id === selectedVariationId) ?? null;
  const galleryImages =
    selectedVariation?.images?.length ? selectedVariation.images : images;

  return (
    <div className="space-y-4">
      <ImageGallery images={galleryImages} name={name} />
      {variations.length > 0 && (
        <VariationSelector
          variations={variations}
          selectedId={selectedVariationId}
          onSelect={setSelectedVariationId}
        />
      )}
    </div>
  );
}
