"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { ImageGallery } from "@/components/shop/image-gallery";
import { VariationSelector } from "@/components/shop/variation-selector";
import { useCart } from "@/components/shop/cart-provider";
import { getProductMaxStock } from "@/lib/utils/stock";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { Product, ProductVariation } from "@/types";

const BUYNOW_KEY = "rdm_buynow";

interface ProductDetailClientProps {
  productId: string;
  name: string;
  price: number | null;
  stock: number;
  images: string[];
  variations: ProductVariation[];
  categoryName?: string;
  categorySlug?: string;
  description?: string | null;
  whatsappNumber: string;
}

export function ProductDetailClient({
  productId,
  name,
  price,
  stock,
  images,
  variations,
  categoryName,
  categorySlug,
  description,
  whatsappNumber,
}: ProductDetailClientProps) {
  const router = useRouter();
  const { addItem } = useCart();

  const defaultVariation = variations.find((v) => v.is_default);
  const [selectedVariationId, setSelectedVariationId] = useState<string | null>(
    defaultVariation?.id ?? variations[0]?.id ?? null
  );
  const [quantity, setQuantity] = useState(1);

  const selectedVariation = variations.find((v) => v.id === selectedVariationId) ?? null;
  const galleryImages = selectedVariation?.images?.length ? selectedVariation.images : images;

  const productForStock: Product = {
    id: productId, name, slug: "", description: null, price, stock,
    images, category_id: null, is_active: true, featured: false,
    created_at: "", variations,
  };

  const maxStock = getProductMaxStock(productForStock, selectedVariationId);
  const hasStock = maxStock > 0;

  // Resetear cantidad al cambiar variación
  function handleSelectVariation(id: string | null) {
    setSelectedVariationId(id);
    setQuantity(1);
  }

  const formatted =
    price != null
      ? new Intl.NumberFormat("es-AR", {
          style: "currency",
          currency: "ARS",
          minimumFractionDigits: 0,
        }).format(price)
      : "Consultar precio";

  function buildCartItem() {
    return {
      id: productId,
      item_type: "product" as const,
      name,
      image: selectedVariation?.images?.[0] ?? images[0] ?? "",
      price: price ?? 0,
      quantity,
      variation_id: selectedVariation?.id,
      variation_label: selectedVariation?.label,
    };
  }

  function handleAddToCart() {
    if (!hasStock) return;
    addItem(buildCartItem());
    toast.success(`¡${quantity > 1 ? `${quantity}x ` : ""}${name} agregado al carrito!`);
  }

  function handleBuyNow() {
    if (!hasStock) return;
    sessionStorage.setItem(BUYNOW_KEY, JSON.stringify([buildCartItem()]));
    router.push("/checkout?source=buynow");
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">
      {/* Columna izquierda: galería + selector de variaciones */}
      <div className="space-y-4">
        <ImageGallery key={selectedVariationId ?? "base"} images={galleryImages} name={name} />
        {variations.length > 0 && (
          <VariationSelector
            variations={variations}
            selectedId={selectedVariationId}
            onSelect={handleSelectVariation}
          />
        )}
      </div>

      {/* Columna derecha: info + acciones */}
      <div className="flex flex-col gap-4">
        {categoryName && categorySlug && (
          <Link
            href={`/catalogo?categoria=${categorySlug}`}
            className="text-xs font-semibold text-brand-olive uppercase tracking-wide hover:text-brand-olive transition-colors w-fit"
          >
            {categoryName}
          </Link>
        )}

        <h1 className="text-3xl font-extrabold text-brand-dark leading-tight">{name}</h1>

        <p className="text-2xl font-bold text-brand-orange">{formatted}</p>

        {description && (
          <p className="text-brand-brown leading-relaxed">{description}</p>
        )}

        {/* Selector de cantidad */}
        {hasStock && (
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-brand-dark">Cantidad</span>
            <div className="flex items-center border border-brand-sand rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="px-3 py-2 text-brand-dark hover:bg-brand-cream transition-colors disabled:opacity-30"
                aria-label="Reducir cantidad"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="px-4 py-2 text-sm font-bold text-brand-dark min-w-[2.5rem] text-center">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(maxStock, q + 1))}
                disabled={quantity >= maxStock}
                className="px-3 py-2 text-brand-dark hover:bg-brand-cream transition-colors disabled:opacity-30"
                aria-label="Aumentar cantidad"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            {maxStock <= 5 && (
              <span className="text-xs text-brand-warm-gray">
                ({maxStock} disponible{maxStock !== 1 ? "s" : ""})
              </span>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2 mt-2">
          <button
            onClick={handleBuyNow}
            disabled={!hasStock}
            className={`w-full flex items-center justify-center gap-2 py-3.5 px-6 font-semibold rounded-xl transition-colors text-sm ${
              hasStock
                ? "bg-brand-terracotta hover:bg-brand-terracotta-hover text-white cursor-pointer"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            {hasStock ? "Comprar ahora" : "Sin stock"}
          </button>

          {hasStock && (
            <button
              onClick={handleAddToCart}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 font-semibold rounded-xl border-2 border-brand-terracotta text-brand-terracotta hover:bg-brand-terracotta hover:text-white transition-colors text-sm cursor-pointer"
            >
              Agregar al carrito
            </button>
          )}

          <a
            href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`¡Hola! Estoy mirando el ${name} en Ritual del Mate y quiero consultar antes de comprarlo`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 font-semibold rounded-xl border-2 border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white transition-colors text-sm"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Consultar por WhatsApp
          </a>
        </div>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="envios" className="border-brand-sand">
            <AccordionTrigger className="text-sm font-semibold text-brand-dark hover:text-brand-orange hover:no-underline">
              Envíos y consultas
            </AccordionTrigger>
            <AccordionContent className="text-sm text-brand-brown leading-relaxed">
              Realizamos envíos a todo el país por Andreani o correo argentino. Una vez que
              confirmás tu compra, coordinamos el envío por WhatsApp. Los tiempos de entrega
              varían según la localidad.
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
  );
}
