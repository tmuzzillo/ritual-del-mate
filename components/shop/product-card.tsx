import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types";

function formatPrice(price: number | null): string {
  if (price == null) return "Consultar precio";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(price);
}

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  // Priorizar imagen de variación default, luego fallback a images[] del producto
  const defaultVariation = product.variations?.find((v) => v.is_default && v.is_active);
  const coverImage = defaultVariation?.images?.[0] ?? product.images[0] ?? null;

  return (
    <Link
      href={`/producto/${product.slug}`}
      className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-brand-sand hover:shadow-md transition-shadow"
    >
      <div className="relative aspect-square bg-brand-cream overflow-hidden">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-brand-warm-gray text-xs">Sin imagen</span>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col gap-1">
        <h3 className="font-semibold text-brand-charcoal text-sm leading-snug line-clamp-2">
          {product.name}
        </h3>
        <p className="text-brand-terracotta font-bold text-sm mt-1">
          {formatPrice(product.price)}
        </p>
      </div>
    </Link>
  );
}
