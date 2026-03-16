"use client";

import Image from "next/image";
import type { ProductVariation } from "@/types";

interface VariationSelectorProps {
  variations: ProductVariation[];
  selectedId: string | null;
  onSelect: (variationId: string | null) => void;
}

export function VariationSelector({ variations, selectedId, onSelect }: VariationSelectorProps) {
  const active = variations.filter((v) => v.is_active);
  if (active.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-brand-charcoal">Variaciones</p>
      <div className="flex flex-wrap gap-3">
        {active.map((v) => {
          const isSelected = v.id === selectedId;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => onSelect(isSelected ? null : v.id)}
              className={`flex flex-col items-center gap-1 p-1 rounded-lg border-2 transition-colors ${
                isSelected
                  ? "border-brand-terracotta"
                  : "border-transparent hover:border-brand-sand"
              }`}
            >
              <div className="relative w-16 h-16 rounded-md overflow-hidden bg-brand-cream">
                {v.images[0] ? (
                  <Image
                    src={v.images[0]}
                    alt={v.label}
                    fill
                    sizes="64px"
                    className="object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-brand-warm-gray text-xs">?</span>
                  </div>
                )}
              </div>
              <span className="text-xs text-brand-charcoal text-center max-w-[64px] leading-tight">
                {v.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
