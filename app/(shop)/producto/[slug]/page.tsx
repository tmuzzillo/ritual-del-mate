import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FallbackImage } from "@/components/shop/fallback-image";
import { ProductDetailClient } from "@/components/shop/product-detail-client";
import type { ProductVariation } from "@/types";
import type { Metadata } from "next";

const DEFAULT_SHIPPING = "Realizamos envíos a todo el país por Andreani o correo argentino. Una vez que confirmás tu compra, coordinamos el envío por WhatsApp. Los tiempos de entrega varían según la localidad.";

async function getShopConfigTexts(): Promise<{ whatsappNumber: string; shippingText: string }> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ??
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    const res = await fetch(`${baseUrl}/api/shop-config`, { cache: "no-store" });
    if (!res.ok) throw new Error();
    const json = await res.json();
    return {
      whatsappNumber: json.data?.whatsapp_number || "543535104448",
      shippingText: json.data?.shipping_disclaimer || DEFAULT_SHIPPING,
    };
  } catch {
    return { whatsappNumber: "543535104448", shippingText: DEFAULT_SHIPPING };
  }
}

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("name, description")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!data) return { title: "Producto no encontrado" };

  return {
    title: `${data.name} · Ritual del Mate`,
    description: data.description ?? undefined,
  };
}

export default async function ProductoPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("*, category:categories(id, name, slug), variations:product_variations(id, label, images, is_active, sort_order, stock, is_default)")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!product) notFound();

  const [{ data: relatedProducts }, { data: relatedSets }, { whatsappNumber, shippingText }] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, slug, price, images, variations:product_variations(id, images, is_default, is_active)")
      .eq("is_active", true)
      .neq("id", product.id)
      .limit(8),
    supabase
      .from("sets")
      .select("id, name, slug, price, images")
      .eq("is_active", true)
      .limit(8),
    getShopConfigTexts(),
  ]);

  const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

  const related = [
    ...shuffle(relatedProducts ?? []).slice(0, 2).map((p) => ({ ...p, type: "product" as const })),
    ...shuffle(relatedSets ?? []).slice(0, 2).map((s) => ({ ...s, type: "set" as const })),
  ];

  const activeVariations = ((product.variations ?? []) as ProductVariation[])
    .filter((v) => v.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <Link
        href="/catalogo"
        className="text-sm text-brand-brown hover:text-brand-dark transition-colors mb-8 inline-block"
      >
        ← Volver al catálogo
      </Link>

      <ProductDetailClient
        productId={product.id}
        name={product.name}
        price={product.price}
        stock={product.stock}
        images={product.images}
        variations={activeVariations}
        categoryName={product.category?.name}
        categorySlug={product.category?.slug}
        description={product.description}
        careText={product.care_text}
        shippingText={shippingText}
        whatsappNumber={whatsappNumber}
      />

      {related.length > 0 && (
        <div className="mt-16 border-t border-brand-sand pt-12">
          <h2 className="text-lg font-bold text-brand-dark mb-6">También te podría gustar</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {related.map((item) => {
              const href = item.type === "product" ? `/producto/${item.slug}` : `/set/${item.slug}`;
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
