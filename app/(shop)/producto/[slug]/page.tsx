import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FallbackImage } from "@/components/shop/fallback-image";
import { ProductDetailClient } from "@/components/shop/product-detail-client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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

  const [{ data: relatedProducts }, { data: relatedSets }] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, slug, price, images")
      .eq("is_active", true)
      .neq("id", product.id)
      .limit(8),
    supabase
      .from("sets")
      .select("id, name, slug, price, images")
      .eq("is_active", true)
      .limit(8),
  ]);

  const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

  const related = [
    ...shuffle(relatedProducts ?? []).slice(0, 2).map((p) => ({ ...p, type: "product" as const })),
    ...shuffle(relatedSets ?? []).slice(0, 2).map((s) => ({ ...s, type: "set" as const })),
  ];

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

  const waMessage = encodeURIComponent(`Hola! Me interesa el producto "${product.name}" 🧉`);
  const waUrl = `https://wa.me/543535104448?text=${waMessage}`;

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

          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 w-full flex items-center justify-center gap-2 py-3.5 px-6
                       bg-brand-orange hover:bg-brand-orange-hover text-white
                       font-semibold rounded-xl transition-colors text-sm"
          >
            Consultar en WhatsApp <span aria-hidden="true">→</span>
          </a>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="envios" className="border-brand-sand">
              <AccordionTrigger className="text-sm font-semibold text-brand-dark hover:text-brand-orange hover:no-underline">
                Envíos y consultas
              </AccordionTrigger>
              <AccordionContent className="text-sm text-brand-brown leading-relaxed">
                Realizamos envíos a todo el país por Andreani o correo argentino. Una vez que nos
                escribís por WhatsApp, te confirmamos disponibilidad y coordinamos el envío. Los
                tiempos de entrega varían según la localidad.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="cuidados" className="border-brand-sand">
              <AccordionTrigger className="text-sm font-semibold text-brand-dark hover:text-brand-orange hover:no-underline">
                Cuidados del producto
              </AccordionTrigger>
              <AccordionContent className="text-sm text-brand-brown leading-relaxed">
                Los mates artesanales requieren un proceso de curado antes del primer uso. Te
                recomendamos llenarlos con yerba húmeda durante 24 horas y secarlos bien. Evitá
                lavarlos con detergente y guardalos sin la bombilla para que respiren.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

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
              const firstImage = Array.isArray(item.images) ? item.images[0] : null;

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
