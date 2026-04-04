"use client";

import Image from "next/image";
import { X, Minus, Plus } from "lucide-react";
import { getImageUrl } from "@/lib/utils/image";
import type { CartItem } from "@/types";

interface CartItemRowProps {
  item: CartItem;
  onUpdateQty: (qty: number) => void;
  onRemove: () => void;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(price);
}

export function CartItemRow({ item, onUpdateQty, onRemove }: CartItemRowProps) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-brand-sand last:border-0">
      {/* Imagen */}
      <div className="relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-brand-cream border border-brand-sand">
        {item.image ? (
          <Image
            src={getImageUrl(item.image, 200)}
            alt={item.name}
            fill
            sizes="56px"
            className="object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-brand-sand text-xs">
            Sin imagen
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-brand-dark leading-snug line-clamp-1">
          {item.name}
        </p>
        {item.variation_label && (
          <p className="text-xs text-brand-warm-gray mt-0.5">{item.variation_label}</p>
        )}
        <p className="text-sm font-bold text-brand-orange mt-0.5">
          {formatPrice(item.price)}
        </p>
      </div>

      {/* Controles de cantidad */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => onUpdateQty(item.quantity - 1)}
          aria-label="Reducir cantidad"
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-brand-sand text-brand-dark hover:bg-brand-sand transition-colors"
        >
          <Minus className="h-3 w-3" />
        </button>
        <span className="w-6 text-center text-sm font-semibold text-brand-dark">
          {item.quantity}
        </span>
        <button
          onClick={() => onUpdateQty(item.quantity + 1)}
          aria-label="Aumentar cantidad"
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-brand-sand text-brand-dark hover:bg-brand-sand transition-colors"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      {/* Eliminar */}
      <button
        onClick={onRemove}
        aria-label="Eliminar del carrito"
        className="flex-shrink-0 p-1 text-brand-warm-gray hover:text-brand-dark transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
