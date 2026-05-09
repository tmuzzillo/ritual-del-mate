import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FallbackImage } from "@/components/shop/fallback-image";
import { SetDetailClient } from "@/components/shop/set-detail-client";
import type { Metadata } from "next";
import type { SetItem } from "@/types";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("sets")
    .select("name, description")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!data) return { title: "Set no encontrado" };

  return {
    title: `${data.name} · Ritual del Mate`,
    description: data.description ?? undefined,
  };
}

export default async function SetPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: set } = await supabase
    .from("sets")
    .select(`
      *,
      category:categories(id, name, slug),
      set_items(
        id, quantity, is_gift,
        product:products(id, name, slug, price, images, is_active, stock),
        variation:product_variations(id, label, images, stock)
      )
    `)
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!set) notFound();

  const [{ data: relatedSets }, { data: relatedProducts }] = await Promise.all([
    supabase
      .from("sets")
      .select("id, name, slug, price, images")
      .eq("is_active", true)
      .neq("id", set.id)
      .limit(8),
    supabase
      .from("products")
      .select("id, name, slug, price, images, variations:product_variations(images, is_default, is_active)")
      .eq("is_active", true)
      .limit(8),
  ]);

  const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

  const related = [
    ...shuffle(relatedSets ?? []).slice(0, 2).map((s) => ({ ...s, type: "set" as const })),
    ...shuffle(relatedProducts ?? []).slice(0, 2).map((p) => ({ ...p, type: "product" as const })),
  ];

  const formatted = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(set.price ?? 0);

  const activeItems = (set.set_items ?? []).filter(
    (si: SetItem) => si.product?.is_active
  );


  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <Link
        href="/sets"
        className="text-sm text-brand-brown hover:text-brand-dark transition-colors mb-8 inline-block"
      >
        ← Volver a sets
      </Link>

      <SetDetailClient
        set={{ ...set, set_items: set.set_items ?? [] }}
        activeItems={activeItems}
        formatted={formatted}
      />

      {related.length > 0 && (
        <div className="mt-16 border-t border-brand-sand pt-12">
          <h2 className="text-lg font-bold text-brand-dark mb-6">También te podría gustar</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {related.map((item) => {
              const href = item.type === "set" ? `/set/${item.slug}` : `/producto/${item.slug}`;
              const itemFormatted = new Intl.NumberFormat("es-AR", {
                style: "currency",
                currency: "ARS",
                minimumFractionDigits: 0,
              }).format(item.price ?? 0);
              const defaultVariation = item.type === "product"
                ? (item as { variations?: { images: string[]; is_default: boolean; is_active: boolean }[] }).variations?.find((v) => v.is_default && v.is_active)
                : null;
              const firstImage = defaultVariation?.images?.[0] ?? (Array.isArray(item.images) ? item.images[0] : null);

              return (
                <Link key={`${item.type}-${item.id}`} href={href} className="group">
                  <div className="aspect-square bg-brand-cream rounded-xl overflow-hidden mb-3">
                    {firstImage ? (
                      <FallbackImage
                        src={firstImage}
                        alt={item.name}
                        width={300}
                        height={300}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-brand-sand text-xs">
                        Sin imagen
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-brand-dark group-hover:text-brand-orange transition-colors leading-snug">
                    {item.name}
                  </p>
                  <p className="text-sm text-brand-brown mt-0.5">{itemFormatted}</p>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
