import Image from "next/image";
import Link from "next/link";
import { getImageUrl } from "@/lib/utils/image";
import { createClient } from "@/lib/supabase/server";
import type { Collection } from "@/types";

export default async function ColeccionesPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("collections")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const collections = (data ?? []) as Collection[];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <h1 className="text-3xl font-extrabold text-brand-dark mb-8">Colecciones</h1>

      {collections.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((col) => (
            <Link
              key={col.id}
              href={`/colecciones/${col.slug}`}
              className="group relative rounded-2xl overflow-hidden border border-brand-sand bg-brand-cream aspect-[4/3] block"
            >
              {col.images[0] && (
                <Image
                  src={getImageUrl(col.images[0], 900)}
                  alt={col.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/70 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h2 className="font-extrabold text-white text-lg leading-tight">{col.name}</h2>
                {col.description && (
                  <p className="text-white/75 text-sm mt-1 line-clamp-2">{col.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <p className="text-brand-brown text-lg">No hay colecciones disponibles por el momento.</p>
        </div>
      )}
    </div>
  );
}
