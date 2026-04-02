import Link from "next/link";
import { Gift } from "lucide-react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ImageGallery } from "@/components/shop/image-gallery";
import type { Metadata } from "next";

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
        product:products(id, name, slug, price, images, is_active),
        variation:product_variations(id, label, images)
      )
    `)
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!set) notFound();

  const formatted = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(set.price);

  const activeItems = (set.set_items ?? []).filter(
    (si: { product?: { is_active: boolean } | null }) => si.product?.is_active
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <Link
        href="/sets"
        className="text-sm text-brand-brown hover:text-brand-dark transition-colors mb-8 inline-block"
      >
        ← Volver a sets
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">
        <ImageGallery images={set.images} name={set.name} />

        <div className="flex flex-col gap-4">
          <span className="text-xs font-semibold text-brand-olive uppercase tracking-wide">Set</span>

          <h1 className="text-3xl font-extrabold text-brand-dark leading-tight">{set.name}</h1>

          <p className="text-2xl font-bold text-brand-orange">{formatted}</p>

          {set.description && (
            <p className="text-brand-brown leading-relaxed whitespace-pre-wrap">{set.description}</p>
          )}

          {/* Products in set */}
          <div className="mt-2">
            <h2 className="text-sm font-semibold text-brand-dark mb-3 uppercase tracking-wide">
              Incluye
            </h2>
            {activeItems.length > 0 ? (
              <ul className="space-y-2">
                {activeItems.map((si: { id: string; quantity: number; is_gift?: boolean; product?: { name: string; slug: string } | null; variation?: { label: string } | null }) => (
                  <li key={si.id} className="flex items-center gap-3 text-sm text-brand-brown">
                    {si.is_gift ? (
                      <Gift className="flex-shrink-0 h-5 w-5 text-brand-orange" />
                    ) : (
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-cream text-brand-dark font-bold text-xs flex items-center justify-center">
                        {si.quantity}
                      </span>
                    )}
                    <div>
                      {si.product ? (
                        <Link
                          href={`/producto/${si.product.slug}`}
                          className="hover:text-brand-dark transition-colors block"
                        >
                          {si.product.name}
                          {si.is_gift && <span className="ml-1.5 text-xs text-brand-orange font-semibold">· de regalo</span>}
                        </Link>
                      ) : (
                        <span>Producto</span>
                      )}
                      {si.variation && (
                        <span className="text-xs text-brand-brown opacity-70">{si.variation.label}</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-brand-brown">Sin productos detallados.</p>
            )}
          </div>

          <div className="mt-4 rounded-xl bg-brand-cream p-4 text-sm text-brand-brown">
            Para consultas y compras, escribinos por{" "}
            <a
              href="https://www.instagram.com/ritualdelmate.store?igsh=MWl2b2FzYXYzOWI2ZA%3D%3D&utm_source=qr"
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
