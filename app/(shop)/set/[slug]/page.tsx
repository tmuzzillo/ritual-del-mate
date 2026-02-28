import Link from "next/link";
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
        id, quantity,
        product:products(id, name, slug, price, images, is_active)
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
        className="text-sm text-brand-warm-gray hover:text-brand-charcoal transition-colors mb-8 inline-block"
      >
        ← Volver a sets
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">
        <ImageGallery images={set.images} name={set.name} />

        <div className="flex flex-col gap-4">
          <span className="text-xs font-semibold text-brand-olive uppercase tracking-wide">Set</span>

          <h1 className="text-3xl font-extrabold text-brand-charcoal leading-tight">{set.name}</h1>

          <p className="text-2xl font-bold text-brand-terracotta">{formatted}</p>

          {set.description && (
            <p className="text-brand-warm-gray leading-relaxed">{set.description}</p>
          )}

          {/* Products in set */}
          <div className="mt-2">
            <h2 className="text-sm font-semibold text-brand-charcoal mb-3 uppercase tracking-wide">
              Incluye
            </h2>
            {activeItems.length > 0 ? (
              <ul className="space-y-2">
                {activeItems.map((si: { id: string; quantity: number; product?: { name: string; slug: string } | null }) => (
                  <li key={si.id} className="flex items-center gap-3 text-sm text-brand-warm-gray">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-cream text-brand-charcoal font-bold text-xs flex items-center justify-center">
                      {si.quantity}
                    </span>
                    {si.product ? (
                      <Link
                        href={`/producto/${si.product.slug}`}
                        className="hover:text-brand-charcoal transition-colors"
                      >
                        {si.product.name}
                      </Link>
                    ) : (
                      <span>Producto</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-brand-warm-gray">Sin productos detallados.</p>
            )}
          </div>

          <div className="mt-4 rounded-xl bg-brand-cream p-4 text-sm text-brand-warm-gray">
            Para consultas y compras, escribinos por{" "}
            <a
              href="https://www.instagram.com/ritualdelmate"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-terracotta font-semibold hover:text-brand-terracotta-hover transition-colors"
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
