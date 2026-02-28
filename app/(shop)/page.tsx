import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/shop/product-card";
import { SetCard } from "@/components/shop/set-card";
import type { Product, MateSet, Collection } from "@/types";

export default async function HomePage() {
  const supabase = await createClient();

  const [
    { data: featuredProducts },
    { data: featuredSets },
    { data: collections },
  ] = await Promise.all([
    supabase
      .from("products")
      .select("*, category:categories(id, name, slug)")
      .eq("is_active", true)
      .eq("featured", true)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("sets")
      .select("*, category:categories(id, name, slug), set_items(id, quantity, product:products(id, name, slug, price, images, is_active))")
      .eq("is_active", true)
      .eq("featured", true)
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("collections")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
  ]);

  const products = (featuredProducts ?? []) as Product[];
  const sets = (featuredSets ?? []) as MateSet[];
  const activeCollections = (collections ?? []) as Collection[];

  return (
    <div>
      {/* Hero */}
      <section className="bg-brand-cream">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-32 flex flex-col items-center text-center gap-6">
          <h1 className="text-4xl sm:text-6xl font-extrabold text-brand-charcoal tracking-tight leading-tight">
            Ritual del Mate
          </h1>
          <p className="text-brand-warm-gray text-base sm:text-lg max-w-xl leading-relaxed">
            Mates y accesorios seleccionados con intención.
            <br className="hidden sm:block" />
            Transforma tu momento matero en ritual.
          </p>
          <Link
            href="/catalogo"
            className="mt-2 inline-flex items-center justify-center rounded-full bg-brand-terracotta text-white font-semibold px-8 py-3 text-sm hover:bg-brand-terracotta-hover transition-colors"
          >
            Ver catálogo
          </Link>
        </div>
      </section>

      {/* Featured Products */}
      {products.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <div className="flex items-end justify-between mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-charcoal">
              Productos destacados
            </h2>
            <Link
              href="/catalogo"
              className="text-sm font-semibold text-brand-terracotta hover:text-brand-terracotta-hover transition-colors"
            >
              Ver todos →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Featured Sets */}
      {sets.length > 0 && (
        <section className="bg-brand-cream/40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
            <div className="flex items-end justify-between mb-8">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-charcoal">
                Sets seleccionados
              </h2>
              <Link
                href="/sets"
                className="text-sm font-semibold text-brand-terracotta hover:text-brand-terracotta-hover transition-colors"
              >
                Ver todos →
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {sets.map((set) => (
                <SetCard key={set.id} set={set} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Collections */}
      {activeCollections.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-charcoal mb-8">
            Colecciones
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeCollections.map((collection) => (
              <CollectionCard key={collection.id} collection={collection} />
            ))}
          </div>
        </section>
      )}

      {/* Sobre mí */}
      <section className="bg-brand-charcoal text-brand-cream">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center flex flex-col items-center gap-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold">Sobre mí</h2>
          <p className="text-brand-sand leading-relaxed text-base sm:text-lg">
            Soy un emprendimiento argentino que cree en la magia del mate compartido.
            Cada accesorio que elijo tiene una historia, una textura, una intención.
            Porque preparar el mate no es solo una costumbre — es un ritual.
          </p>
          <p className="text-brand-warm-gray text-sm">
            Villa María, Córdoba, Argentina · Envíos a todo el país
          </p>
        </div>
      </section>
    </div>
  );
}

function CollectionCard({ collection }: { collection: Collection }) {
  const coverImage = collection.images[0] ?? null;

  return (
    <div className="group relative rounded-2xl overflow-hidden border border-brand-sand bg-brand-cream aspect-[4/3]">
      {coverImage && (
        <Image
          src={coverImage}
          alt={collection.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-brand-charcoal/70 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <h3 className="font-extrabold text-white text-lg leading-tight">{collection.name}</h3>
        {collection.description && (
          <p className="text-white/75 text-sm mt-1 line-clamp-2">{collection.description}</p>
        )}
      </div>
    </div>
  );
}
