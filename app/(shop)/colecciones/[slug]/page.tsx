import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/shop/product-card";
import { SetCard } from "@/components/shop/set-card";
import type { Metadata } from "next";
import type { Product, MateSet } from "@/types";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("collections")
    .select("name, description")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!data) return { title: "Colección no encontrada" };

  return {
    title: `${data.name} · Ritual del Mate`,
    description: data.description ?? undefined,
  };
}

export default async function ColeccionDetailPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: collection } = await supabase
    .from("collections")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!collection) notFound();

  // Fetch active products and sets in this collection via junction tables
  const [{ data: cpRows }, { data: csRows }] = await Promise.all([
    supabase
      .from("collection_products")
      .select("product:products(*, category:categories(id, name, slug))")
      .eq("collection_id", collection.id),
    supabase
      .from("collection_sets")
      .select("set:sets(*, category:categories(id, name, slug), set_items(id, quantity, product:products(id, name, slug, price, images, is_active)))")
      .eq("collection_id", collection.id),
  ]);

  const products = (cpRows ?? [])
    .map((r: { product: unknown }) => r.product)
    .filter((p): p is Product => !!p && (p as Product).is_active) as Product[];

  const sets = (csRows ?? [])
    .map((r: { set: unknown }) => r.set)
    .filter((s): s is MateSet => !!s && (s as MateSet).is_active) as MateSet[];

  const hasContent = products.length > 0 || sets.length > 0;
  const coverImage = collection.images[0] ?? null;

  return (
    <div>
      {/* Header */}
      <div className="relative bg-brand-cream h-48 sm:h-64 overflow-hidden">
        {coverImage && (
          <Image
            src={coverImage}
            alt={collection.name}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 max-w-6xl mx-auto px-4 sm:px-6 pb-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
            {collection.name}
          </h1>
          {collection.description && (
            <p className="text-white/80 text-sm sm:text-base mt-1 max-w-2xl">
              {collection.description}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Link
          href="/colecciones"
          className="text-sm text-brand-brown hover:text-brand-dark transition-colors mb-8 inline-block"
        >
          ← Volver a colecciones
        </Link>

        {!hasContent ? (
          <div className="py-16 text-center">
            <p className="text-brand-brown text-lg">
              No hay items disponibles en esta colección por el momento.
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {products.length > 0 && (
              <section>
                <h2 className="text-xl font-extrabold text-brand-dark mb-6">Productos</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            )}

            {sets.length > 0 && (
              <section>
                <h2 className="text-xl font-extrabold text-brand-dark mb-6">Sets</h2>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {sets.map((set) => (
                    <SetCard key={set.id} set={set} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
