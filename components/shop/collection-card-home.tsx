import Image from "next/image";
import Link from "next/link";
import { getImageUrl } from "@/lib/utils/image";
import type { Collection } from "@/types";

interface CollectionCardHomeProps {
  collection: Collection;
}

export function CollectionCardHome({ collection }: CollectionCardHomeProps) {
  const coverImage = collection.images?.[0] ?? null;

  return (
    <Link
      href={`/colecciones/${collection.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl aspect-[3/4] sm:aspect-[4/3] bg-brand-dark"
    >
      {/* Imagen de fondo */}
      {coverImage ? (
        <Image
          src={getImageUrl(coverImage, 900)}
          alt={collection.name}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-brand-olive" />
      )}

      {/* Overlay degradado */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      {/* Contenido */}
      <div className="relative mt-auto p-6">
        <p className="text-brand-golden text-xs font-semibold uppercase tracking-widest mb-1">
          {collection.tagline ?? ""}
        </p>
        <h3 className="text-brand-cream text-2xl font-bold leading-tight mb-3">
          {collection.name}
        </h3>
        <span className="inline-flex items-center gap-1 text-brand-cream/80 text-sm font-medium group-hover:gap-2 transition-all">
          Ver sets
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </Link>
  );
}
