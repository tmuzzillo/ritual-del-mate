import Image from "next/image";
import Link from "next/link";
import type { MateSet } from "@/types";

interface SetCardProps {
  set: MateSet;
}

export function SetCard({ set }: SetCardProps) {
  const coverImage = set.images[0] ?? null;
  const formatted = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(set.price);

  const pieceCount = set.set_items?.length ?? 0;

  return (
    <Link
      href={`/set/${set.slug}`}
      className="group flex flex-col bg-brand-cream rounded-2xl overflow-hidden border border-brand-sand hover:shadow-md transition-shadow"
    >
      <div className="relative aspect-square bg-brand-cream overflow-hidden">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={set.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-brand-brown text-xs">Sin imagen</span>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col gap-1">
        <span className="text-xs font-semibold text-brand-orange uppercase tracking-wide">Set</span>
        <h3 className="font-semibold text-brand-dark text-sm leading-snug line-clamp-2">
          {set.name}
        </h3>
        {set.description && (
          <p className="text-brand-brown text-xs line-clamp-1 mt-0.5">{set.description}</p>
        )}
        {pieceCount > 0 && (
          <p className="text-brand-olive text-xs mt-0.5">{pieceCount} {pieceCount === 1 ? "pieza incluida" : "piezas incluidas"}</p>
        )}
        <p className="text-brand-orange font-bold text-sm mt-1">{formatted}</p>
      </div>
    </Link>
  );
}
