import Link from "next/link";
import Image from "next/image";
import { Gift } from "lucide-react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ImageGallery } from "@/components/shop/image-gallery";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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

  const [{ data: relatedSets }, { data: relatedProducts }] = await Promise.all([
    supabase
      .from("sets")
      .select("id, name, slug, price, images")
      .eq("is_active", true)
      .neq("id", set.id)
      .limit(8),
    supabase
      .from("products")
      .select("id, name, slug, price, images")
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
    (si: { product?: { is_active: boolean } | null }) => si.product?.is_active
  );

  const waMessage = encodeURIComponent(`Hola! Me interesa el set "${set.name}" 🧉`);
  const waUrl = `https://wa.me/543535104448?text=${waMessage}`;

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

          {activeItems.length > 0 && (
            <div className="border-t border-brand-sand pt-4">
              <h2 className="text-xs font-semibold text-brand-dark mb-3 uppercase tracking-wide">
                Detalles del Set
              </h2>
              <ul className="space-y-2.5">
                {activeItems.map((si: { id: string; quantity: number; is_gift?: boolean; product?: { name: string; slug: string } | null; variation?: { label: string } | null }) => (
                  <li key={si.id} className="flex items-center gap-3 text-sm text-brand-brown">
                    {si.is_gift ? (
                      <Gift className="flex-shrink-0 h-4 w-4 text-brand-orange" />
                    ) : (
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-sand text-brand-dark font-bold text-xs flex items-center justify-center">
                        {si.quantity}
                      </span>
                    )}
                    <div>
                      {si.product ? (
                        <Link
                          href={`/producto/${si.product.slug}`}
                          className="font-medium hover:text-brand-dark transition-colors"
                        >
                          {si.product.name}
                          {si.is_gift && (
                            <span className="ml-1.5 text-xs text-brand-orange font-semibold">· de regalo</span>
                          )}
                        </Link>
                      ) : (
                        <span className="font-medium">Producto</span>
                      )}
                      {si.variation && (
                        <span className="block text-xs text-brand-brown opacity-60">{si.variation.label}</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
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
              const href = item.type === "set" ? `/set/${item.slug}` : `/producto/${item.slug}`;
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
                      <Image
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
