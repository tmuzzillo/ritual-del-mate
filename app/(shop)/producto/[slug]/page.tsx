import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductDetailClient } from "@/components/shop/product-detail-client";
import type { ProductVariation } from "@/types";
import type { Metadata } from "next";

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
    .select("*, category:categories(id, name, slug), variations:product_variations(id, label, images, is_active, sort_order)")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!product) notFound();

  const activeVariations = ((product.variations ?? []) as ProductVariation[])
    .filter((v) => v.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);

  const formatted =
    product.price != null
      ? new Intl.NumberFormat("es-AR", {
          style: "currency",
          currency: "ARS",
          minimumFractionDigits: 0,
        }).format(product.price)
      : "Consultar precio";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <Link
        href="/catalogo"
        className="text-sm text-brand-brown hover:text-brand-dark transition-colors mb-8 inline-block"
      >
        ← Volver al catálogo
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">
        <ProductDetailClient
          images={product.images}
          name={product.name}
          variations={activeVariations}
        />

        <div className="flex flex-col gap-4">
          {product.category && (
            <Link
              href={`/catalogo?categoria=${product.category.slug}`}
              className="text-xs font-semibold text-brand-olive uppercase tracking-wide hover:text-brand-olive transition-colors w-fit"
            >
              {product.category.name}
            </Link>
          )}

          <h1 className="text-3xl font-extrabold text-brand-dark leading-tight">
            {product.name}
          </h1>

          <p className="text-2xl font-bold text-brand-orange">{formatted}</p>

          {product.description && (
            <p className="text-brand-brown leading-relaxed">{product.description}</p>
          )}

          <div className="mt-4 rounded-xl bg-brand-cream p-4 text-sm text-brand-brown">
            Para consultas y compras, escribinos por{" "}
            <a
              href="https://www.instagram.com/ritualdelmate"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-orange font-semibold hover:text-brand-orange-hover transition-colors"
            >
              Instagram
            </a>
            .
          </div>
        </div>
      </div>
    </div>
  );
}
